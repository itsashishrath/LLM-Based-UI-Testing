import React, { useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

// Import the FeatureCard component from accordi.jsx
const FeatureCard = ({ feature }) => (
  <Card className="mb-6 border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="font-bold text-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">{feature.description}</CardHeader>
    <CardContent className="bg-white bg-opacity-90 rounded-b-lg">
      <p className="font-semibold mb-2 text-indigo-700">Preconditions:</p>
      <p className="mb-4 text-gray-700">{feature.pre_conditions}</p>

      <p className="font-semibold mb-2 text-indigo-700">Steps:</p>
      <ul className="list-disc pl-5 mb-4 text-gray-700">
        {feature.steps.map((step, index) => (
          <li key={index} className="mb-1">{step}</li>
        ))}
      </ul>

      <p className="font-semibold mb-2 text-indigo-700">Expected Results:</p>
      <ul className="list-disc pl-5 text-gray-700">
        {feature.expected_results.map((result, index) => (
          <li key={index} className="mb-1">{result}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default function App() {
  const [context, setContext] = useState('');
  const [images, setImages] = useState([]);
  const [instructions, setInstructions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improvementContext, setImprovementContext] = useState('');

  const handleContextChange = (e) => {
    setContext(e.target.value);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('context', context);
    images.forEach((image, index) => {
      formData.append(`image${index}`, image);
    });

    try {
      const response = await axios.post('http://localhost:5000/generate_instructions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("Raw API response:", response.data);
      
      const parsedInstructions = JSON.parse(response.data.instructions);
      setInstructions(parsedInstructions);
      console.log("Parsed instructions:", parsedInstructions);
    } catch (error) {
      console.error('Error:', error);
      setInstructions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprovementContextChange = (e) => {
    setImprovementContext(e.target.value);
  };

  const handleImprove = async (e) => {
    e.preventDefault();
    setIsImproving(true);

    const formData = new FormData();
    formData.append('previousInstructions', JSON.stringify(instructions));
    formData.append('improvementContext', improvementContext);

    if (!instructions) {
      console.log("No instructions to improve");
      return;
    }

    setIsImproving(true);
    console.log("Sending improvement request with context:", improvementContext);

    try {
      const response = await axios.post('http://localhost:5000/improve_instructions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Raw improvement API response:", response.data);
      

      const improvedInstructions = JSON.parse(response.data.modifications);
      setInstructions(improvedInstructions);
      console.log("Parsed improved instructions:", improvedInstructions);
    } catch (error) {
      console.error('Error improving instructions:', error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-8">
      <Card className="max-w-2xl mx-auto bg-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Testing Instructions Generator</CardTitle>
          <CardDescription className="text-center text-gray-600">Upload screenshots and get detailed testing instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="context" className="text-sm font-medium text-gray-700">Optional Context</Label>
              <Textarea
                id="context"
                value={context}
                onChange={handleContextChange}
                placeholder="Enter any additional context here..."
                className="w-full h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images" className="text-sm font-medium text-gray-700">Upload Screenshots</Label>
              <Input
                type="file"
                id="images"
                multiple
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img src={URL.createObjectURL(image)} alt={`Uploaded ${index}`} className="w-20 h-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : 'Describe Testing Instructions'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {instructions && instructions.features && (
        <Card className="mt-8 max-w-4xl mx-auto bg-white bg-opacity-80 rounded-xl shadow-2xl p-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {instructions.features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
            <div className="mt-6 space-y-4">
              <Label htmlFor="improvementContext" className="text-sm font-medium text-gray-700">Suggest improvements or changes</Label>
              <Textarea
                id="improvementContext"
                value={improvementContext}
                onChange={handleImprovementContextChange}
                placeholder="Suggest any improvements or changes for the test cases..."
                className="w-full h-24"
              />
              <Button
                onClick={handleImprove}
                disabled={isImproving}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
              >
                {isImproving ? 'Improving...' : 'Improve with Multi-shot Prompting'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}