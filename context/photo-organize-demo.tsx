  const createNewFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newStructure = { ...previewStructure };
    newStructure[newFolderName.trim()] = [];
    setPreviewStructure(newStructure);
    setNewFolderName('');
    setShowNewFolderInput(false);
    setHasUserChanges(true);
  };  const handleCustomQuery = (e) => {
    if (e.key === 'Enter' && customQuery.trim()) {
      setOrganizationMethod('custom');
      startOrganizing();
    }
  };  const runAIWithCorrections = () => {
    console.log('runAIWithCorrections called');
    setIsProcessing(true);
    setShowPreview(false); // Hide the workspace and show loading
    
    setTimeout(() => {
      console.log('AI reorganization starting');
      
      // Get all current photos
      const allPhotos = Object.values(previewStructure).flat();
      console.log('All photos:', allPhotos);
      
      // Simple reorganization for testing
      const newStructure = {
        'AI_Reorganized_Group_1': allPhotos.slice(0, 2),
        'AI_Reorganized_Group_2': allPhotos.slice(2, 4),
        'AI_Reorganized_Group_3': allPhotos.slice(4)
      };
      
      // Remove empty folders
      Object.keys(newStructure).forEach(key => {
        if (newStructure[key].length === 0) {
          delete newStructure[key];
        }
      });
      
      console.log('New structure:', newStructure);
      setPreviewStructure(newStructure);
      setIsProcessing(false);
      setShowPreview(true); // Show the workspace again with new structure
      setHasUserChanges(false);
      console.log('AI reorganization complete');
    }, 2000);
  };import React, { useState, useEffect } from 'react';
import { Upload, Calendar, MapPin, Users, Check, X, RefreshCw, Folder, Image, ChevronRight, ChevronDown } from 'lucide-react';

const PhotoOrganizeDemo = () => {
  const [currentStep, setCurrentStep] = useState('upload'); // upload, organize, preview, complete
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [organizationMethod, setOrganizationMethod] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['2024', '2024-03']));
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [previewStructure, setPreviewStructure] = useState({});
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [isDraggingOverNewFolder, setIsDraggingOverNewFolder] = useState(false);
  const [showNewFolderPrompt, setShowNewFolderPrompt] = useState(false);
  const [pendingPhotoForNewFolder, setPendingPhotoForNewFolder] = useState(null);
  const [aiProgress, setAiProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('analyzing'); // 'analyzing' or 'reorganizing'

  // Mock photo data for preview with thumbnails
  const mockPhotos = [
    { name: 'IMG_001.jpg', date: '2024-03-15', location: 'Beach', people: ['John', 'Sarah'], thumb: 'https://picsum.photos/200/150?random=1' },
    { name: 'IMG_002.jpg', date: '2024-03-15', location: 'Beach', people: ['John', 'Sarah'], thumb: 'https://picsum.photos/200/150?random=2' },
    { name: 'IMG_003.jpg', date: '2024-03-16', location: 'Restaurant', people: ['John'], thumb: 'https://picsum.photos/200/150?random=3' },
    { name: 'IMG_004.jpg', date: '2024-03-20', location: 'Home', people: ['Sarah', 'Kids'], thumb: 'https://picsum.photos/200/150?random=4' },
    { name: 'IMG_005.jpg', date: '2024-04-01', location: 'Park', people: ['Family'], thumb: 'https://picsum.photos/200/150?random=5' },
  ];

  const handleFolderSelect = () => {
    setSelectedFolder('~/Photos/Vacation_2024');
    setCurrentStep('organize');
  };

  const handleTagSelect = (tag) => {
    let query = '';
    switch (tag) {
      case 'time':
        query = 'Organize photos by date taken, creating year/month/day folder structure';
        break;
      case 'location':
        query = 'Group photos by location data from GPS metadata or image analysis';
        break;
      case 'people':
        query = 'Use face recognition to group photos by people in the photos';
        break;
    }
    setCustomQuery(query);
    setOrganizationMethod('custom');
  };

  const startOrganizing = () => {
    if (!customQuery.trim()) return;
    
    setOrganizationMethod('custom');
    setIsProcessing(true);
    setCurrentStep('preview');
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowPreview(true);
      setPreviewStructure(generateInitialStructure());
    }, 2000);
  };

  const generateInitialStructure = () => {
    // For all methods, we now use 'custom' since everything goes through AI query
    if (customQuery.toLowerCase().includes('date') || customQuery.toLowerCase().includes('time') || customQuery.toLowerCase().includes('year/month/day')) {
      return {
        '2024-03-15': mockPhotos.filter(p => p.date === '2024-03-15'),
        '2024-03-16': mockPhotos.filter(p => p.date === '2024-03-16'),
        '2024-03-20': mockPhotos.filter(p => p.date === '2024-03-20'),
        '2024-04-01': mockPhotos.filter(p => p.date === '2024-04-01')
      };
    } else if (customQuery.toLowerCase().includes('location') || customQuery.toLowerCase().includes('gps')) {
      return {
        'Beach': mockPhotos.filter(p => p.location === 'Beach'),
        'Restaurant': mockPhotos.filter(p => p.location === 'Restaurant'),
        'Home': mockPhotos.filter(p => p.location === 'Home'),
        'Park': mockPhotos.filter(p => p.location === 'Park')
      };
    } else if (customQuery.toLowerCase().includes('people') || customQuery.toLowerCase().includes('face')) {
      return {
        'John_Sarah': mockPhotos.filter(p => p.people.includes('John') && p.people.includes('Sarah')),
        'John': mockPhotos.filter(p => p.people.includes('John') && !p.people.includes('Sarah')),
        'Sarah_Kids': mockPhotos.filter(p => p.people.includes('Sarah') && p.people.includes('Kids')),
        'Family': mockPhotos.filter(p => p.people.includes('Family'))
      };
    } else if (customQuery.toLowerCase().includes('month')) {
      return {
        'March_2024': mockPhotos.filter(p => p.date.startsWith('2024-03')),
        'April_2024': mockPhotos.filter(p => p.date.startsWith('2024-04'))
      };
    } else if (customQuery.toLowerCase().includes('indoor') || customQuery.toLowerCase().includes('outdoor')) {
      return {
        'Indoor': mockPhotos.filter(p => ['Restaurant', 'Home'].includes(p.location)),
        'Outdoor': mockPhotos.filter(p => ['Beach', 'Park'].includes(p.location))
      };
    } else {
      // Default custom organization
      return {
        'Events': mockPhotos.slice(0, 3),
        'Portraits': mockPhotos.slice(3)
      };
    }
  };

  const handleDragStart = (photo, fromFolder) => {
    setDraggedPhoto({ photo, fromFolder });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNewFolderDragOver = (e) => {
    e.preventDefault();
    if (draggedPhoto) {
      setIsDraggingOverNewFolder(true);
    }
  };

  const handleNewFolderDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOverNewFolder(false);
  };

  const handleDrop = (e, toFolder) => {
    e.preventDefault();
    setIsDraggingOverNewFolder(false);
    
    if (!draggedPhoto) return;
    
    const { photo, fromFolder } = draggedPhoto;
    
    // Handle drop on create new folder area
    if (toFolder === '__CREATE_NEW__') {
      setPendingPhotoForNewFolder({ photo, fromFolder });
      setShowNewFolderPrompt(true);
      setDraggedPhoto(null);
      return;
    }
    
    if (fromFolder === toFolder) return;
    
    // Remove photo from source folder
    const newStructure = { ...previewStructure };
    newStructure[fromFolder] = newStructure[fromFolder].filter(p => p.name !== photo.name);
    
    // Add photo to destination folder
    if (!newStructure[toFolder]) {
      newStructure[toFolder] = [];
    }
    newStructure[toFolder] = [...newStructure[toFolder], photo];
    
    // Clean up empty folders
    if (newStructure[fromFolder].length === 0) {
      delete newStructure[fromFolder];
    }
    
    setPreviewStructure(newStructure);
    setDraggedPhoto(null);
    setHasUserChanges(true);
  };

  const createNewFolderWithPhoto = () => {
    if (!newFolderName.trim() || !pendingPhotoForNewFolder) return;
    
    const { photo, fromFolder } = pendingPhotoForNewFolder;
    const newStructure = { ...previewStructure };
    
    // Remove photo from source folder
    newStructure[fromFolder] = newStructure[fromFolder].filter(p => p.name !== photo.name);
    
    // Create new folder with the photo
    newStructure[newFolderName.trim()] = [photo];
    
    // Clean up empty folders
    if (newStructure[fromFolder].length === 0) {
      delete newStructure[fromFolder];
    }
    
    setPreviewStructure(newStructure);
    setNewFolderName('');
    setShowNewFolderPrompt(false);
    setPendingPhotoForNewFolder(null);
    setHasUserChanges(true);
  };

  const cancelNewFolderCreation = () => {
    setNewFolderName('');
    setShowNewFolderPrompt(false);
    setPendingPhotoForNewFolder(null);
  };

  const startEditingFolder = (folderName) => {
    setEditingFolder(folderName);
    setEditFolderName(folderName);
  };

  const saveEditedFolderName = () => {
    if (!editFolderName.trim() || editFolderName === editingFolder) {
      setEditingFolder(null);
      return;
    }
    
    const newStructure = { ...previewStructure };
    newStructure[editFolderName.trim()] = newStructure[editingFolder];
    delete newStructure[editingFolder];
    
    setPreviewStructure(newStructure);
    setEditingFolder(null);
    setEditFolderName('');
    setHasUserChanges(true);
  };

  const cancelEditingFolder = () => {
    setEditingFolder(null);
    setEditFolderName('');
  };

  const toggleFolder = (folderName) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const renderWorkspace = () => {
    return (
      <div className="space-y-4">
        {Object.entries(previewStructure).map(([folderName, photos]) => (
          <div
            key={folderName}
            className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-4 min-h-32 hover:border-gray-300 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, folderName)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Folder className="w-5 h-5 mr-2 text-blue-500" />
                {editingFolder === folderName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEditedFolderName();
                        if (e.key === 'Escape') cancelEditingFolder();
                      }}
                      autoFocus
                      onBlur={saveEditedFolderName}
                    />
                    <button
                      onClick={saveEditedFolderName}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditingFolder}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span 
                      className="font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                      onClick={() => startEditingFolder(folderName)}
                      title="Click to edit folder name"
                    >
                      {folderName}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">({photos.length} photos)</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(photo, folderName)}
                  className="relative group cursor-move"
                >
                  <img 
                    src={photo.thumb} 
                    alt={photo.name}
                    className="w-full h-16 object-cover rounded border-2 border-transparent group-hover:border-blue-300 transition-all"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Create New Folder Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-lg p-4 transition-all ${
            isDraggingOverNewFolder 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragOver={handleNewFolderDragOver}
          onDragLeave={handleNewFolderDragLeave}
          onDrop={(e) => handleDrop(e, '__CREATE_NEW__')}
        >
          {showNewFolderPrompt ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                onKeyPress={(e) => e.key === 'Enter' && createNewFolderWithPhoto()}
                autoFocus
              />
              <button
                onClick={createNewFolderWithPhoto}
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                Create
              </button>
              <button
                onClick={cancelNewFolderCreation}
                className="text-gray-500 hover:text-gray-700 px-2"
              >
                Cancel
              </button>
            </div>
          ) : showNewFolderInput ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                onKeyPress={(e) => e.key === 'Enter' && createNewFolder()}
                autoFocus
              />
              <button
                onClick={createNewFolder}
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }}
                className="text-gray-500 hover:text-gray-700 px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className={`text-center ${isDraggingOverNewFolder ? 'text-blue-600' : ''}`}>
              <button
                onClick={() => setShowNewFolderInput(true)}
                className={`w-full text-left flex items-center transition-colors ${
                  isDraggingOverNewFolder 
                    ? 'text-blue-600 hover:text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`w-5 h-5 mr-2 border-2 border-dashed rounded flex items-center justify-center transition-colors ${
                  isDraggingOverNewFolder ? 'border-blue-500' : 'border-gray-400'
                }`}>
                  <span className="text-sm">+</span>
                </div>
                Create new folder
              </button>
              <p className={`text-xs mt-2 transition-colors ${
                isDraggingOverNewFolder 
                  ? 'text-blue-500 font-medium' 
                  : 'text-gray-400'
              }`}>
                {isDraggingOverNewFolder 
                  ? 'Release to create new folder!' 
                  : 'or drag a photo here to create a new folder'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleAccept = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setCurrentStep('complete');
      setIsProcessing(false);
    }, 1500);
  };

  const handleReorganize = () => {
    if (!reorganizeText.trim()) return;
    
    setIsProcessing(true);
    setShowPreview(false);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowPreview(true);
      setReorganizeText('');
    }, 1500);
  };

  const handleCancel = () => {
    setCurrentStep('upload');
    setSelectedFolder(null);
    setOrganizationMethod('');
    setCustomQuery('');
    setShowPreview(false);
    setHasUserChanges(false);
    setPreviewStructure({});
  };

  if (currentStep === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">✱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PhotoOrganize</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-12 text-center mb-8">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Drag & Drop or choose a folder to upload</h2>
            <p className="text-gray-500 mb-6">you can only select one parent folder</p>
            <button 
              onClick={handleFolderSelect}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Choose Folder
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            Your photos will be organized directly in the selected folder with a new structure
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'organize') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">✱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PhotoOrganize</h1>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-green-600 mb-2">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-medium">Folder Selected</span>
                </div>
                <p className="text-gray-600">{selectedFolder}</p>
                <p className="text-sm text-gray-500 mt-1">5 photos found</p>
              </div>
              <button
                onClick={() => {
                  setSelectedFolder(null);
                  setCurrentStep('upload');
                  setOrganizationMethod('');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Change folder
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">How do you want to organize the folder?</h2>
            
            {/* Prominent AI query section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">✨</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Describe your organization</h3>
                  <p className="text-gray-600 text-sm">Tell AI how you want to organize your photos</p>
                </div>
              </div>
              
              {/* Quick tag options */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
                  onClick={() => handleTagSelect('time')}
                >
                  <Calendar className="w-4 h-4 text-gray-600 mr-1" />
                  <span className="font-medium text-gray-700">Time</span>
                </button>

                <button 
                  className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
                  onClick={() => handleTagSelect('location')}
                >
                  <MapPin className="w-4 h-4 text-gray-600 mr-1" />
                  <span className="font-medium text-gray-700">Location</span>
                </button>

                <button 
                  className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
                  onClick={() => handleTagSelect('people')}
                >
                  <Users className="w-4 h-4 text-gray-600 mr-1" />
                  <span className="font-medium text-gray-700">People</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full ml-1">AI</span>
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyPress={handleCustomQuery}
                  placeholder="e.g., 'separate indoor and outdoor photos', 'group by month', 'organize vacation photos separately'"
                  className="flex-1 p-4 border border-blue-200 rounded-lg text-base bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={startOrganizing}
                  disabled={!customQuery.trim()}
                  className={`px-6 py-4 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    customQuery.trim()
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Start organizing
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> or click the button to start organizing with AI
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  AI Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'preview') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">✱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PhotoOrganize</h1>
          </div>

          {isProcessing ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              {/* Stage Headers */}
              {currentStage === 'analyzing' ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">AI Analyzing</h2>
                  <p className="text-gray-600 mb-6">Learning from your organization preferences and photo content</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Reorganizing Your Photos</h2>
                  <p className="text-gray-600 mb-6">Creating new folder structure and moving photos</p>
                </>
              )}
              
              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{aiProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${aiProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Stage-specific Progress Steps */}
              <div className="text-sm text-gray-500 min-h-6">
                {currentStage === 'analyzing' && (
                  <>
                    {aiProgress < 15 && "Reading photo metadata..."}
                    {aiProgress >= 15 && aiProgress < 30 && "Analyzing image content..."}
                    {aiProgress >= 30 && aiProgress < 45 && "Learning from your changes..."}
                    {aiProgress >= 45 && "Preparing organization strategy..."}
                  </>
                )}
                {currentStage === 'reorganizing' && (
                  <>
                    {aiProgress < 65 && "Creating new folders..."}
                    {aiProgress >= 65 && aiProgress < 85 && "Moving photos to new locations..."}
                    {aiProgress >= 85 && "Finalizing organization..."}
                  </>
                )}
              </div>
            </div>
          ) : showPreview ? (
            <div className="space-y-6">
              {/* Workspace Header */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Photo Organization Workspace</h2>
                    <p className="text-sm text-gray-600">Drag photos between folders or create new ones</p>
                  </div>
                  {hasUserChanges && (
                    <div
                      onMouseDown={() => {
                        setIsProcessing(true);
                        setShowPreview(false);
                        setAiProgress(0);
                        setCurrentStage('analyzing');
                        
                        // Stage 1: AI Analyzing (0-50%)
                        let progress = 0;
                        const stage1Interval = setInterval(() => {
                          progress += 2;
                          setAiProgress(progress);
                          if (progress >= 50) {
                            clearInterval(stage1Interval);
                            setCurrentStage('reorganizing');
                            
                            // Stage 2: Reorganizing (50-100%)
                            const stage2Interval = setInterval(() => {
                              progress += 2;
                              setAiProgress(progress);
                              if (progress >= 100) {
                                clearInterval(stage2Interval);
                                
                                setTimeout(() => {
                                  const allPhotos = Object.values(previewStructure).flat();
                                  const newStructure = {
                                    'AI_Group_1': allPhotos.slice(0, 2),
                                    'AI_Group_2': allPhotos.slice(2, 4),
                                    'AI_Group_3': allPhotos.slice(4)
                                  };
                                  Object.keys(newStructure).forEach(key => {
                                    if (newStructure[key].length === 0) {
                                      delete newStructure[key];
                                    }
                                  });
                                  setPreviewStructure(newStructure);
                                  setIsProcessing(false);
                                  setShowPreview(true);
                                  setHasUserChanges(false);
                                  setAiProgress(0);
                                  setCurrentStage('analyzing');
                                }, 500);
                              }
                            }, 150);
                          }
                        }, 150);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center cursor-pointer select-none"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <span className="mr-1">✨</span>
                      )}
                      AI Re-organize
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Workspace */}
              <div className="bg-gray-50 rounded-lg p-6">
                {renderWorkspace()}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex space-x-4">
                  <button 
                    onClick={handleAccept}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Apply Organization
                  </button>
                  
                  <button 
                    onClick={handleCancel}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">✱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PhotoOrganize</h1>
          </div>

                      <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Organization Complete!</h2>
            <p className="text-gray-600 mb-8">
              Your photos have been successfully organized by {
                organizationMethod === 'time' ? 'date' : 
                organizationMethod === 'location' ? 'location' : 'people'
              }.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-medium text-gray-900 mb-3">What happened:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 5 photos organized into folders</li>
                <li>✓ Original file quality preserved</li>
                <li>✓ EXIF data maintained</li>
                <li>✓ Folder structure created</li>
              </ul>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => {
                  // In a real app, this would open the file explorer to the organized folder
                  alert(`Opening folder: ${selectedFolder}`);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium w-full"
              >
                Open Folder
              </button>
              
              <button 
                onClick={() => {
                  setCurrentStep('upload');
                  setSelectedFolder(null);
                  setOrganizationMethod('');
                  setCustomQuery('');
                  setShowPreview(false);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium w-full"
              >
                Organize More Photos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default PhotoOrganizeDemo;