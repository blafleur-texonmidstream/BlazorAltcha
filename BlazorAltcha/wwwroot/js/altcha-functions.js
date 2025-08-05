// This is a regular script (not a module) that loads ALTCHA
window.initAltcha = function(dotNetRef, element, hiddenInput, challengeUrl, verifyUrl, callbackName, test) {
    console.log('initAltcha called with parameters:', {
        element: element,
        hiddenInput: hiddenInput,
        challengeUrl: challengeUrl,
        verifyUrl: verifyUrl,
        callbackName: callbackName,
        test: test
    });
    console.log('dotNetRef:', dotNetRef);
    
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
        script.type = 'text/javascript'; // Explicitly set script type
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Altcha script'));
        document.head.appendChild(script);
    });
}

function initializeAltchaWidget(dotNetRef, element, hiddenInput, challengeUrl, verifyUrl, callbackName, test) {
    try {
        console.log('Initializing Altcha widget with:', {
            element: element,
            hiddenInput: hiddenInput,
            challengeUrl: challengeUrl,
            verifyUrl: verifyUrl,
            callbackName: callbackName,
            test: test
        });
        
        // Create the altcha-widget element
        const altchaWidget = document.createElement('altcha-widget');
        
        // Set attributes
        altchaWidget.id = element.id;
        altchaWidget.className = element.className;
        
        // Important: Set these attributes which are required by ALTCHA
        if (challengeUrl) {
            altchaWidget.setAttribute('challengeurl', challengeUrl);
            console.log('Set challengeurl attribute:', challengeUrl);
        } else {
            console.error('Challenge URL is not set');
        }
        
        if (verifyUrl) {
            altchaWidget.setAttribute('verifyurl', verifyUrl);
            console.log('Set verifyurl attribute:', verifyUrl);
        }
        
        altchaWidget.setAttribute('data-name', hiddenInput.name);
        altchaWidget.setAttribute('data-auto', 'onsubmit');
        altchaWidget.setAttribute('data-test', test.toString());
        
        // Replace the original element with the altcha-widget
        element.replaceWith(altchaWidget);
        
        // Define the verification callback function
        window[callbackName] = function(token) {
            console.log('Altcha verification callback triggered with token:', token);
            
            try {
                // Update the hidden input value
                hiddenInput.value = token;
                console.log('Updated hidden input value');
                
                // Try direct invocation first
                console.log('Invoking Blazor method OnAltchaVerified directly');
                dotNetRef.invokeMethodAsync('OnAltchaVerified', token)
                    .then(() => {
                        console.log('OnAltchaVerified method called successfully');
                    })
                    .catch(error => {
                        console.error('Error calling OnAltchaVerified method:', error);
                    });
            } catch (error) {
                console.error('Error in Altcha verification callback:', error);
            }
        };
        
        // Add a listener to the altcha-widget for the 'verified' event
        altchaWidget.addEventListener('verified', function(e) {
            console.log('Altcha verified event triggered:', e);
            const token = e.detail && e.detail.payload ? e.detail.payload : altchaWidget.getAttribute('data-token');
            console.log('Token from event:', token);
            
            if (token) {
                try {
                    // Call the verification callback
                    window[callbackName](token);
                } catch (error) {
                    console.error('Error handling verified event:', error);
                }
            }
        });
        
        console.log('Altcha widget initialized');
    } catch (error) {
        console.error('Error initializing Altcha widget:', error);
    }
}

function resetAltcha(element) {
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

function getAltchaToken(name = 'altcha-token') {
    const input = document.querySelector(`input[name="${name}"]`);
    return input ? input.value : '';
}
