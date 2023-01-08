
+
37
-
0
import { templates } from '../settings.js';

class HomePage {
  constructor(element) {
    const thisHomePage = this;

    thisHomePage.element = element;

    thisHomePage.render(thisHomePage.element);
    thisHomePage.initWidgets();
  }
  render(element) {
    const thisHomePage = this;
    const generatedHTML = templates.homePage();

    thisHomePage.dom = {};
    thisHomePage.dom.wrapper = element;
    thisHomePage.dom.wrapper.innerHTML = generatedHTML;
  }
  initWidgets() {
    const elem = document.querySelector('.carousel');

    new Flickity(elem, {
      imagesLoaded: true,
      prevNextButtons: false,
      draggable: false,
      pageDots: false,
      autoPlay: 3500,
      wrapAround: true,
      accessibility: false,
      selectedAttraction: 0.01,
      friction: 0.10
    });
  }
}

export default HomePage;