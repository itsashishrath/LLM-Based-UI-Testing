import google.generativeai as genai
import os
import PIL

gemma_api = os.getenv("GEMINISTUDIOKEY")
genai.configure(api_key=gemma_api)

image_paths = ["temp_uploads/image1.png", "temp_uploads/image2.png"]
prompt = "What do you see in these images?"

model = genai.GenerativeModel('gemini-1.5-flash', 
                                  generation_config={"response_mime_type": "application/json"})
images = [PIL.Image.open(path) for path in image_paths]
response = model.generate_content([prompt] + images)
        
print(response.text)