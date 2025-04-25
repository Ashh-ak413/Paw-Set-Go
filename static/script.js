// 
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const chatButton = document.getElementById('vetbot-button');
    
    // Create modal structure
    const modal = document.createElement('div');
    modal.id = 'vetbot-modal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'VetBot Assistant';
    modalTitle.style.color = '#ff6b6b';
    
    const closeButton = document.createElement('span');
    closeButton.className = 'close-modal';
    closeButton.innerHTML = '&times;';
    
    const chatMessages = document.createElement('div');
    chatMessages.id = 'chat-messages';
    chatMessages.className = 'chat-messages';
    
    const chatInput = document.createElement('div');
    chatInput.className = 'chat-input';
    
    const userInput = document.createElement('input');
    userInput.id = 'user-message';
    userInput.type = 'text';
    userInput.placeholder = "Describe your pet's symptoms...";
    
    const sendButton = document.createElement('button');
    sendButton.id = 'send-message';
    sendButton.className = 'primary-btn';
    sendButton.textContent = 'Send';
    
    // Build modal structure
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    chatInput.appendChild(userInput);
    chatInput.appendChild(sendButton);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(chatMessages);
    modalContent.appendChild(chatInput);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Track conversation state
    let conversationState = {
        user_id: 'user_' + Math.random().toString(36).substr(2, 9),
        pet_type: null,
        symptoms: [],
        step: 'identify_pet'
    };
    
    // Toggle modal when clicked
    chatButton.addEventListener('click', function(e) {
        e.preventDefault();
        modal.style.display = 'block';
        // Add welcome message if chat is empty
        if (chatMessages.children.length === 0) {
            addBotMessage("Hello! I'm VetBot. Is your pet a cat or dog?");
        }
        // Focus on input field when modal opens
        userInput.focus();
    });
    
    // Close modal when X is clicked
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
    
    // Send message on button click or Enter key
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addUserMessage(message);
            userInput.value = '';
            
            // Call backend API
            fetch('http://localhost:5000/vet_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: conversationState.user_id,
                    messages: [{
                        role: 'user',
                        content: message
                    }]
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    addBotMessage("Sorry, I encountered an error. Please try again later.");
                    console.error(data.error);
                } else {
                    // Update conversation state
                    conversationState = data.state || conversationState;
                    
                    // Add bot response
                    if (data.reply) {
                        if (data.reply.includes('🚨 EMERGENCY')) {
                            addEmergencyMessage(data.reply);
                        } else {
                            addBotMessage(data.reply);
                        }
                    }
                }
            })
            .catch(error => {
                addBotMessage("Sorry, I'm having trouble connecting to the VetBot service. Please try again later.");
                console.error('Fetch error:', error);
            });
        }
    }
    
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addEmergencyMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message emergency-message';
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});