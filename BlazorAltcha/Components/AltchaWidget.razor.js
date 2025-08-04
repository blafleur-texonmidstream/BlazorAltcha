// AltchaWidget.js - JavaScript module for Blazor integration

export function initAltcha(dotNetRef, element, hiddenInput, challengeUrl, verifyUrl, callbackName, test) {
    // First, ensure the Altcha script is loaded
    if (!window.altcha || !window.customElements.get('altcha-widget')) {
        console.log('Loading Altcha script');
        loadAltchaScript().then(() => {
            console.log('Altcha script loaded, initializing widget');
            initializeAltchaWidget(dotNetRef, element, hiddenInput, challengeUrl, verifyUrl, callbackName, test);
        }).catch(error => {
            console.error('Failed to load Altcha script:', error);
        });
    } else {
        initializeAltchaWidget(dotNetRef, element, hiddenInput, challengeUrl, verifyUrl, callbackName, test);
    }
}

function loadAltchaScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/js/altcha.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Altcha script'));
        document.head.appendChild(script);
    });
}

function initializeAltchaWidget(dotNetRef, element, hiddenInput, challengeUrl, verifyUrl, callbackName, test) {
    try {
        // Create the altcha-widget element
        const altchaWidget = document.createElement('altcha-widget');
        
        // Set attributes
        altchaWidget.id = element.id;
        altchaWidget.className = element.className;
        altchaWidget.setAttribute('challengeurl', challengeUrl);
        altchaWidget.setAttribute('verifyurl', verifyUrl);
        altchaWidget.setAttribute('data-name', hiddenInput.name);
        altchaWidget.setAttribute('data-auto', 'onsubmit');
        altchaWidget.setAttribute('data-test', test.toString());
        
        // Replace the original element with the altcha-widget
        element.replaceWith(altchaWidget);
        
        // Define callback function in window scope
        window[callbackName] = function(token) {
            console.log('Altcha verification complete, token received');
            // Update the hidden input value
            hiddenInput.value = token;
            // Notify Blazor component
            dotNetRef.invokeMethodAsync('OnAltchaVerified', token);
        };
        
        console.log('Altcha widget initialized');
    } catch (error) {
        console.error('Error initializing Altcha widget:', error);
    }
}

export function resetAltcha(element) {
    try {
        // Find the altcha-widget element
        const altchaWidget = document.querySelector('altcha-widget');
        if (altchaWidget && typeof altchaWidget.reset === 'function') {
            altchaWidget.reset();
            console.log('Altcha widget reset');
            return true;
        } else {
            console.log('Altcha widget not found or reset method not available');
            return false;
        }
    } catch (error) {
        console.error('Error resetting Altcha widget:', error);
        return false;
    }
}

export function getAltchaToken(name = 'altcha-token') {
    const input = document.querySelector(`input[name="${name}"]`);
    return input ? input.value : '';
}
