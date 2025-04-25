from collections import defaultdict
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from config import apikey

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Initialize Groq client
client = Groq(api_key=apikey)

# Veterinary system prompt with clear instructions
VET_SYSTEM_PROMPT = """You are VetBot Pro, an advanced AI veterinary assistant. Follow these rules strictly:

1. CONVERSATION FLOW:
   - First identify pet type (cat/dog)
   - Then gather symptoms
   - Finally provide analysis

2. RESPONSE FORMAT:
   - Emergency: "🚨 EMERGENCY: [Immediate action required]"
   - Urgent: "⚠️ Urgent: [See vet within 12 hours]"
   - Mild: "ℹ️ Monitor: [Watch for changes]"
   - Always include: "Likely causes:" and "Recommended action:"

3. SAFETY RULES:
   - Never suggest home remedies for serious symptoms
   - Always include disclaimer
   - For emergencies, provide clear instructions"""

# Medical configuration
EMERGENCY_KEYWORDS = ["seizure", "unconscious", "bleeding", "choking", "trauma", "collapse", "poison"]
URGENT_KEYWORDS = ["vomit", "diarrhea", "lethargy", "not eating", "pain"]
COMMON_SYMPTOMS = ["vomiting", "diarrhea", "itching", "limping", "coughing", "sneezing"]

# Conversation state management
conversation_state = defaultdict(dict)

@app.route("/vet_chat", methods=["POST"])
def vet_chat():
    try:
        data = request.get_json()
        user_id = data.get("user_id", "default")
        messages = data.get("messages", [])
        
        # Initialize conversation state if new user
        if user_id not in conversation_state:
            conversation_state[user_id] = {
                "pet_type": None,
                "symptoms": [],
                "step": "identify_pet",
                "severity": None
            }
        
        state = conversation_state[user_id]
        last_message = messages[-1]["content"].lower() if messages else ""

        # Emergency detection (priority check)
        if any(emergency in last_message for emergency in EMERGENCY_KEYWORDS):
            state["severity"] = "emergency"
            return jsonify({
                "reply": (
                    "🚨 EMERGENCY: Your pet needs immediate veterinary care!\n"
                    "1. Keep your pet calm\n"
                    "2. Contact emergency vet NOW\n"
                    "3. Don't give food/water if unconscious\n\n"
                ),
                "state": state
            })

        # Conversation flow control
        if state["step"] == "identify_pet":
            if "dog" in last_message:
                state.update({
                    "pet_type": "dog",
                    "step": "gather_symptoms"
                })
                reply = "What symptoms is your dog showing? (e.g., vomiting, diarrhea, limping)"
            elif "cat" in last_message:
                state.update({
                    "pet_type": "cat",
                    "step": "gather_symptoms"
                })
                reply = "What symptoms is your cat showing? (e.g., not eating, vomiting, hiding)"
            else:
                reply = "First, please tell me - is your pet a cat or dog?"

        elif state["step"] == "gather_symptoms":
            detected_symptoms = [s for s in COMMON_SYMPTOMS if s in last_message]
            if detected_symptoms:
                state["symptoms"].extend(detected_symptoms)
                state["step"] = "provide_analysis"
                reply = "How long has your pet had these symptoms? (hours/days)"
            else:
                reply = "Please describe symptoms like vomiting, diarrhea, or behavior changes"

        else:  # provide_analysis
            # Prepare context for AI
            context = {
                "pet_type": state["pet_type"],
                "symptoms": state["symptoms"],
                "duration": last_message,
                "severity": ("urgent" if any(u in last_message for u in URGENT_KEYWORDS) else "mild")
            }

            # Generate AI response
            messages.append({
                "role": "system",
                "content": f"CONTEXT: {context}\n\n{VET_SYSTEM_PROMPT}"
            })
            
            response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=messages,
                temperature=0.4,
                max_tokens=400,
            )
            reply = response.choices[0].message.content
            
            # Ensure disclaimer exists
            if "ℹ️ This is not professional diagnosis" not in reply:
                reply += "\n\nℹ️ This is not professional diagnosis"

        return jsonify({
            "reply": reply,
            "state": state,
            "disclaimer": "Always consult a licensed veterinarian for medical advice"
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "An error occurred while processing your request"
        }), 500

if __name__ == "__main__":
    app.run(port=5000)