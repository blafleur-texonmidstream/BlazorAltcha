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
    
    // Store the dotNetRef globally for debugging purposes
    window.altchaDotNetRef = dotNetRef;
    window.altchaCallbackName = callbackName;
    
    // Add more debug functions
    window.debugCallAltchaVerified = function(testToken) {
        console.log('Directly calling OnAltchaVerified on Blazor component with token:', testToken || 'debug-direct-token');
        if (dotNetRef && typeof dotNetRef.invokeMethodAsync === 'function') {
            dotNetRef.invokeMethodAsync('OnAltchaVerified', testToken || 'debug-direct-token')
                .then(() => console.log('Successfully called OnAltchaVerified directly'))
                .catch(error => console.error('Error calling OnAltchaVerified directly:', error));
        } else {
            console.error('dotNetRef is invalid or not properly initialized');
        }
    };
    
    // Add a debug function to manually trigger the callback
    window.debugTriggerAltchaCallback = function(testToken) {
        console.log('Manually triggering ALTCHA callback with token:', testToken);
        if (window[callbackName]) {
            window[callbackName](testToken || 'debug-test-token');
        } else {
            console.error('Callback function not found:', callbackName);
        }
    };
    
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
            console.log('ALTCHA verification callback triggered with token:', token);
            
            try {
                // Update the hidden input value
                hiddenInput.value = token;
                console.log('Updated hidden input value to:', token);
                
                // Debug information about dotNetRef
                console.log('DotNetRef type:', typeof dotNetRef);
                
                // IMPORTANT: This is where we call back to Blazor
                console.log('Calling Blazor method OnAltchaVerified...');
                if (dotNetRef && typeof dotNetRef.invokeMethodAsync === 'function') {
                    dotNetRef.invokeMethodAsync('OnAltchaVerified', token)
                        .then(function() {
                            console.log('Successfully called OnAltchaVerified in Blazor component!');
                        })
                        .catch(function(error) {
                            console.error('Error calling OnAltchaVerified:', error);
                        });
                } else {
                    console.error('dotNetRef is invalid or invokeMethodAsync is not a function');
                    console.log('dotNetRef:', dotNetRef);
                }
            } catch (error) {
                console.error('Error in ALTCHA verification callback:', error);
            }
        };
        
        // Add a listener to the altcha-widget for the 'verified' event
        altchaWidget.addEventListener('verified', function(e) {
            console.log('Altcha verified event triggered:', e);
            
            // Try to get the token from different possible sources
            let token = null;
            
            // Try to get from event detail payload first
            if (e.detail && e.detail.payload) {
                token = e.detail.payload;
                console.log('Got token from event.detail.payload:', token);
            } 
            // If not available, try to get from data-token attribute
            else if (altchaWidget.getAttribute('data-token')) {
                token = altchaWidget.getAttribute('data-token');
                console.log('Got token from data-token attribute:', token);
            }
            // If still not available, try to get from the widget element directly
            else if (altchaWidget.token) {
                token = altchaWidget.token;
                console.log('Got token from altchaWidget.token:', token);
            }
            // If still nothing, generate a fallback token
            else {
                token = 'fallback-token-' + Date.now();
                console.log('Generated fallback token:', token);
            }
            
            console.log('Token from event (final):', token);
            
            // Log the verification detail to see what's coming back from your API
            if (e.detail && e.detail.verified !== undefined) {
                console.log('API verification result:', e.detail.verified);
                console.log('Verification detail:', e.detail);
            }
            
            if (token) {
                try {
                    // Call the verification callback
                    window[callbackName](token);
                } catch (error) {
                    console.error('Error handling verified event:', error);
                }
            } else {
                console.error('No token available after verification, cannot proceed with callback');
            }
        });
        
        // If test mode is enabled, automatically trigger verification with a test token
        if (test) {
            console.log('Test mode enabled, automatically triggering verification');
            // Wait a moment for everything to initialize
            setTimeout(() => {
                // Create a test token
                const testToken = 'test-token-' + Date.now();
                // Simulate verification
                window[callbackName](testToken);
            }, 500);
        }
        
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
