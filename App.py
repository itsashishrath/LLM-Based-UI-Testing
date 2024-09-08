import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
import google.generativeai as genai
import PIL
import json
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

UPLOAD_FOLDER = 'temp_uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

json_format = """
{
  "features": [
    {
      "description": string,
      "pre_conditions": string,
      "steps": [string, string, ...],
      "expected_results": [string, string,]
    },
    ...
  ]
}
"""

# Configure the Gemini API (replace with your actual API key)
GEMMA_API = os.getenv("GEMINISTUDIOKEY")
genai.configure(api_key=GEMMA_API)

def clean_text(text):
    # Remove excessive newlines, spaces, and any unwanted characters
    text = re.sub(r'\\n', ' ', text)  # Replace newline characters with a space
    text = re.sub(r'\s+', ' ', text)  # Reduce multiple spaces to a single space
    text = text.strip()  # Remove leading and trailing spaces
    return text

def generate_instructions_with_gemini(context, image_paths):
    print("Generating instructions")
    print(f"Context: {context}")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', 
                                  generation_config={"response_mime_type": "application/json"})
        
        prompt = f"""
        You are a product manager and a tester. You help testers in testing the product with the help of images.
        Analyze the following screenshots of a digital product and provide detailed testing instructions.
        Consider the following context: {context}
        The tech stack is React and TailwindCSS for the frontend, and Flask for the backend.
        For each feature visible in the screenshots, Output should describe a detailed, step-by-step guide on how to test each functionality. Each test case should include:
        Description: What the test case is about.
        Pre-conditions: What needs to be set up or ensured before testing.
        Testing Steps: Clear, step-by-step instructions on how to perform the test.
        Expected Result: What should happen if the feature works correctly.
        
        Present the information in a clear, structured format.
        This is the structure of JSON format you should return:
        {json_format}
        To explain this structure:

        The root object contains a single key "features".
        The value of "features" is an array of objects.
        Each object in the "features" array represents a feature and has four keys:

        "description": A string describing the feature.
        "pre_conditions": A string describing the conditions before the feature is tested.
        "steps": An array of strings, where each string describes a step in testing the feature.
        "expected_results": An array of strings, where each string describes an expected result of the feature.
        Remember, it should be valid JSON only.
        """
        
        images = [PIL.Image.open(path) for path in image_paths]
        response = model.generate_content([prompt] + images)
        cleaned_response = clean_text(response.text)
        # parsed_response = json.loads(response.text)

        # result = json.dumps(parsed_response, indent=2)
        # print(result)
        # return result
        print(cleaned_response)
        return cleaned_response
    except Exception as e:
        print(f"Error in generate_instructions_with_gemini: {str(e)}")
        raise

def suggest_modifications(current_strategy, context):
    print("Suggesting modifications")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash',
                                  generation_config={"response_mime_type": "application/json"})
        
        prompt = f"""
        You are a product manager and a tester. You help testers in testing the product with the help of images.
        Review the following testing strategy and suggest improvements or modifications:
        based on the following context: {context}
        {current_strategy}
        The result should be in the same structure as before.
        This is the JSON format you should return:
        {json_format}
        To explain this structure:

        The root object contains a single key "features".
        The value of "features" is an array of objects.
        Each object in the "features" array represents a feature and has four keys:

        "description": A string describing the feature.
        "pre_conditions": A string describing the conditions before the feature is tested.
        """
        
        response = model.generate_content(prompt)
        return clean_text(response.text)
    except Exception as e:
        print(f"Error in suggest_modifications: {str(e)}")
        raise

@app.route('/generate_instructions', methods=['POST'])
def process_images():
    print("Processing images")
    try:
        context = request.form.get('context', '')
        image_paths = []
        if 'image0' not in request.files:
            return jsonify({'error': 'No images provided'}), 400

        for key, file in request.files.items():
            if key.startswith('image'):
                if file.filename == '':
                    continue
                
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                image_paths.append(filepath)

        if not image_paths:
            print("No valid images provided")
            return jsonify({'error': 'No valid images provided'}), 400

        # print(f"Context: {context}")
        # print(f"Image paths: {image_paths}")

        instructions = generate_instructions_with_gemini(context, image_paths)
        
        # Save instructions to a text file
        with open('current_strategy.txt', 'w') as f:
            f.write(instructions)
        
        return jsonify({'instructions': instructions})
    except Exception as e:
        print(f"Error in process_images: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up temporary files
        for path in image_paths:
            try:
                os.remove(path)
            except Exception as e:
                print(f"Error removing file {path}: {e}")

@app.route('/improve_instructions', methods=['POST'])
def modify_strategy():
    try:
        # Read the current strategy from the file
        if not os.path.exists('current_strategy.txt'):
            return jsonify({'error': 'No existing strategy found'}), 400
        
        with open('current_strategy.txt', 'r') as f:
            current_strategy = f.read()
        
        context = request.form.get('improvementContext', '')
        print(f"Improvement Context: {context}")
        # Generate modifications
        
        modifications = suggest_modifications(current_strategy, context)
        print(f"Modifications: {modifications}")
        # Save the modified strategy
        with open('current_strategy.txt', 'w') as f:
            f.write(modifications)
        
        return jsonify({'modifications': modifications})
    except Exception as e:
        print(f"Error in modify_strategy: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)