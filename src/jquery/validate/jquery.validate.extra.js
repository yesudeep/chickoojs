(function($){
    jQuery.validator.addMethod("mobile", function(mobile_number, element, "Please enter a valid mobile number (eg. +1 650 555 1212)."){
        var re = new RegExp("[+]?[0-9 ]+", "g");
        return re.test(mobile_number);
    });
})(jQuery);

