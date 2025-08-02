// JavaScript functions for Altcha integration
window.initAltcha = function () {
    console.log('Altcha widget should initialize automatically');
    // No need to call altchaInit() - the web component initializes itself
};

window.getAltchaToken = function () {
    // Look for the hidden input that contains the Altcha token
    var tokenInput = document.querySelector('input[name="altcha-token"]');
    return tokenInput ? tokenInput.value : '';
};

window.resetAltcha = function () {
    // Find the Altcha widget element
    var altchaElement = document.querySelector('altcha-widget');
    if (altchaElement) {
        // Reset the Altcha widget by using the custom element's reset method
        if (typeof altchaElement.reset === 'function') {
            altchaElement.reset();
            console.log('Altcha reset');
        } else {
            console.log('Altcha element found but no reset method available');
        }
    } else {
        console.log('Altcha element not found');
    }
};

// A callback function that Altcha can call when verification is complete
window.altchaVerified = function(token) {
    console.log('Altcha verification complete');
    // You can add custom logic here if needed
};
