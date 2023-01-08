import { select, classNames, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    
    thisBooking.element = element;
    thisBooking.bookInfo = {
      tableId: null,
      starters: []
    };

    thisBooking.render(thisBooking.element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.maxDate);
    const params = {
      bookings: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    const urls = {
      bookings: settings.db.url + '/' + settings.db.bookings + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&')
    };

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ]).then(function(allResponses) {
      const bookingsResponse = allResponses[0];
      const eventsCurrentResponse = allResponses[1];
      const eventsRepeatResponse = allResponses[2];

      return Promise.all([
        bookingsResponse.json(),
        eventsCurrentResponse.json(),
        eventsRepeatResponse.json(),
      ]);
    }).then(function([bookings, eventsCurrent, eventsRepeat]) {
      thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
    });
    
  }
  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for(let item of eventsRepeat) {
      if(item.repeat == 'daily') {
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if(typeof thisBooking.booked[thisBooking.date] == 'undefined' || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if(!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) >= 1) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }

      if(table.classList.contains(classNames.booking.tableSelected)) {
        table.classList.remove(classNames.booking.tableSelected);
        thisBooking.bookInfo.tableId = null;
      }
    }
  }
  render(element) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
  
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
    
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(select.booking.starters);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.orderForm = thisBooking.dom.wrapper.querySelector(select.booking.orderForm);
  }
  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function() {
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function(event) {
      event.preventDefault();
      
      thisBooking.initTables(event.target);
    });

    thisBooking.dom.starters.addEventListener('click', function(event) {
      const targetStarter = event.target;

      if(targetStarter.getAttribute('name') == settings.booking.starterAttribute) {
        const starterIdx = thisBooking.bookInfo.starters.indexOf(targetStarter.value);

        if(starterIdx == -1) {
          thisBooking.bookInfo.starters.push(targetStarter.value);
        } else {
          thisBooking.bookInfo.starters.splice(starterIdx, 1);
        }
      }
    });

    thisBooking.dom.orderForm.addEventListener('submit', function(event) {
      event.preventDefault();

      thisBooking.sendBooking();
      thisBooking.updateDOM();
    });
  }
  initTables(table) {
    const thisBooking = this;
    const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
    const selectedTableClass = classNames.booking.tableSelected;

    if(!isNaN(tableId)) {
      if(!table.classList.contains(classNames.booking.tableBooked)) {
        for(let loopTable of thisBooking.dom.tables) {
          const loopTableId = parseInt(loopTable.getAttribute(settings.booking.tableIdAttribute));

          if(loopTable.classList.contains(selectedTableClass) && tableId != loopTableId) {
            loopTable.classList.remove(selectedTableClass);
          }
        }

        thisBooking.bookInfo.tableId = tableId;

        if(thisBooking.bookInfo.tableId == tableId && table.classList.contains(selectedTableClass)) {
          thisBooking.bookInfo.tableId = null;
        }

        table.classList.toggle(selectedTableClass);
      } else {
        alert('This table is booked');
      }
    }
  }
  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;
    const payload = {
      date: thisBooking.datePickerWidget.value,
      hour: thisBooking.hourPickerWidget.value,
      table: thisBooking.bookInfo.tableId,
      duration: thisBooking.hoursAmountWidget.value,
      ppl: thisBooking.peopleAmountWidget.value,
      starters: thisBooking.bookInfo.starters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options).then(function(response) {
      return response.json();
    }).then(function(parsedResponse) {
      console.log('parsedResponse', parsedResponse);
      thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
    });
  }
}

export default Booking;
