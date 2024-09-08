import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, Zap, FolderPlus, FileText, Image } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

const API_BASE_URL = 'http://127.0.0.1:8000/mainPage'; // Replace with your actual API base URL

const API_BASE_URL_LOCAL = 'http://127.0.0.1:8000'; // Replace with your actual API base URL




const ProductTestingDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [image, setImage] = useState(null);
  const [strategy, setStrategy] = useState('');
  const [context, setContext] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');


  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchFeatures(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedFeature) {
      fetchFeatureDetails(selectedFeature);
    }
  }, [selectedFeature]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-projects/`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeatures = async (projectId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-project-features/${projectId}/`);
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeature = async () => {
    if (selectedProject && newFeatureName) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/add-feature/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newFeatureName,
            description: newFeatureDescription,
            project: selectedProject  // Changed from project_id to project
          }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log('New feature added:', data);
          fetchFeatures(selectedProject);
          setNewFeatureName('');
          setNewFeatureDescription('');
        } else {
          const errorData = await response.json();
          console.error('Error adding feature:', errorData);
          // You might want to show an error message to the user here
        }
      } catch (error) {
        console.error('Error adding feature:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchFeatureDetails = async (featureId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-feature-details/${featureId}/`);
      const data = await response.json();
      setImage(data.image);
      setStrategy(data.strategy || '');
    } catch (error) {
      console.error('Error fetching feature details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/add-project/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, description: newProjectDescription }),
      });
      if (response.ok) {
        fetchProjects();
        setNewProjectName('');
        setNewProjectDescription('');
      }
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && selectedFeature) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('image_file', file); 
      try {
        const response = await fetch(`${API_BASE_URL}/api/add-or-replace-image/${selectedFeature}/`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Image upload success:', data);
          fetchFeatureDetails(selectedFeature);
          console.log('hiii');
        } else {
          const errorData = await response.json();
          console.error('Error uploading image:', errorData);
          // You might want to show an error message to the user here
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddStrategy = async () => {
    if (selectedFeature && strategy) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/add-or-replace-strategy/${selectedFeature}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: strategy
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log('Strategy added successfully:', data.message);
          fetchFeatureDetails(selectedFeature);
          // Optionally, you can update the UI or fetch updated feature details here
        } else {
          const errorData = await response.json();
          console.error('Error adding strategy:', errorData);
          // You might want to show an error message to the user here
        }
      } catch (error) {
        console.error('Error adding strategy:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsLoading(false);
      }
    }
  };


  const handleGenerateStrategy = async () => {
    if (selectedFeature && context && image && selectedProject) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('image_file', image);
        formData.append('text_input', context);
        formData.append('feature_id', selectedFeature);
        formData.append('project_id', selectedProject);
  
        const response = await fetch(`${API_BASE_URL}/api/multimodal-llm/`, {
          method: 'POST',
          body: formData,
        });
  
        if (response.ok) {
          const data = await response.json();
          setStrategy(data.response);
        } else {
          const errorData = await response.json();
          console.error('Error generating strategy:', errorData);
          // You might want to show an error message to the user here
        }
      } catch (error) {
        console.error('Error generating strategy:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Product Testing Dashboard</h1>
      
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-indigo-700">Project Management</CardTitle>
              <CardDescription>Select an existing project or create a new one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New Project Name"
                className="w-full"
              />
              <Input
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="New Project Description"
                className="w-full"
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddProject} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                Add New Project
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-indigo-700">Feature Management</CardTitle>
              <CardDescription>Select an existing feature or create a new one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a feature" />
                </SelectTrigger>
                <SelectContent>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                placeholder="New Feature Name"
                className="w-full"
              />
              <Input
                value={newFeatureDescription}
                onChange={(e) => setNewFeatureDescription(e.target.value)}
                placeholder="New Feature Description"
                className="w-full"
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddFeature} disabled={isLoading || !selectedProject} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Add New Feature
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-indigo-700">Feature Image</CardTitle>
              <CardDescription>View or upload an image for the selected feature</CardDescription>
            </CardHeader>
            <CardContent>
              {image ? (
                <img src={`${API_BASE_URL_LOCAL}${image}`} alt="Feature" className="w-full h-auto rounded-lg shadow-md mb-4" />
              ) : (
                <Alert>
                  <AlertDescription>No image available</AlertDescription>
                </Alert>
              )}
              <div className="mt-4">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none hover:border-indigo-400 focus:outline-none">
                    <span className="flex items-center space-x-2">
                      <Upload className="w-6 h-6 text-gray-600" />
                      <span className="font-medium text-gray-600">
                        Click to upload an image
                      </span>
                    </span>
                    <input 
                      id="image-upload" 
                      type="file" 
                      onChange={handleImageUpload} 
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="strategy" className="space-y-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-indigo-700">Testing Strategy</CardTitle>
              <CardDescription>View, add, or generate a testing strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <Textarea
                  value={strategy || ''}
                  onChange={(e) => setStrategy(e.target.value)}
                  placeholder="Enter or view the testing strategy here"
                  className="min-h-[100px] w-full"
                />
              </ScrollArea>
              <Textarea
                value={context || ''}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter context for strategy generation"
                className="min-h-[100px] w-full"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleAddStrategy} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Add Strategy
              </Button>
              <Button onClick={handleGenerateStrategy} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Generate Strategy
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTestingDashboard;