var MODEL = (function () {
  //function that updates the page content
  function _navToPage(pageName, callback, callback2) {
    $.get(`pages/${pageName}/${pageName}.html`, function (data) {
      $("#app").html(data);

      //run a callback function (if provided)
      if (callback) {
        callback();
      }

      //run a second callback function (if provided)
      if (callback2) {
        callback2();
      }
    });
  }

  return {
    navToPage: _navToPage,
  };
})();
