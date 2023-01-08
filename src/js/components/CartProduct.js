import { select } from '../settings.js';
import AmountWidget from './AmountWidget.js';

class CartProduct {
  constructor(menuProduct, element) {
    const thisCartProduct = this;

    thisCartProduct.id = menuProduct.id;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.params = menuProduct.params;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.priceSingle = menuProduct.priceSingle;

    thisCartProduct.getElements(element);
    thisCartProduct.initAmountWidget();
    thisCartProduct.initActions();
  }
  getElements(element) {
    const thisCartProduct = this;

    thisCartProduct.dom = {};
    thisCartProduct.dom.wrapper = element;
    thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
    thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
  }
  initActions() {
    const thisCartProduct = this;

    thisCartProduct.dom.edit.addEventListener('click', function(event) {
      event.preventDefault();
    });

    thisCartProduct.dom.remove.addEventListener('click', function(event) {
      event.preventDefault();
      thisCartProduct.remove();
    });
  }
  initAmountWidget() {
    const thisCartProduct = this;

    thisCartProduct.dom.amountWidget = new AmountWidget(thisCartProduct.dom.wrapper);
    thisCartProduct.dom.amountWidget.value = thisCartProduct.amount;
    thisCartProduct.dom.wrapper.addEventListener('updated', function() {
      thisCartProduct.amount = thisCartProduct.dom.amountWidget.value;
      thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;

      thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      
    });
    thisCartProduct.dom.amountWidget.input.value = thisCartProduct.dom.amountWidget.value;
  }
  remove() {
    const thisCartProduct = this;

    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCartProduct,
      },
    });

    thisCartProduct.dom.wrapper.dispatchEvent(event);
  }
  getData() {
    const thisCartProduct = this;
    const data = {
      id: thisCartProduct.id,
      amount: thisCartProduct.amount,
      price: thisCartProduct.price,
      priceSingle: thisCartProduct.priceSingle,
      name: thisCartProduct.name,
      params: thisCartProduct.params
    };
    return data;
  }
}

export default CartProduct;
