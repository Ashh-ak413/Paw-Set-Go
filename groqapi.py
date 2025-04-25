from groq import Groq
from config import apikey, emergency_contacts

class VetAssistant:
    def __init__(self):
        self.client = Groq(api_key=apikey)
        self.messages = [{
            "role": "system",
            "content": f"""You are a veterinary assistant. Follow these rules:
            1. Identify pet type and symptoms
            2. Classify severity (emergency/urgent/monitor)
            3. For emergencies, include: {emergency_contacts['US']}
            4. Always add disclaimer"""
        }]
    
    def chat(self, user_input):
        self.messages.append({"role": "user", "content": user_input})
        
        completion = self.client.chat.completions.create(
            model="llama3-70b-8192",
            messages=self.messages,
            temperature=0.5,
            max_tokens=1024,
        )
        
        reply = completion.choices[0].message.content
        self.messages.append({"role": "assistant", "content": reply})
        
        return reply