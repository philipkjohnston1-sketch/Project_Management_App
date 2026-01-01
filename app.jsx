import React, { useState, useEffect } from 'react';
import { Home, FileText, Image, Clipboard, Plus, ChevronRight, ArrowLeft, Upload, X, Hammer, FolderPlus, CheckSquare } from 'lucide-react';

export default function ConstructionManager() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [view, setView] = useState('list');
  const [showAddProject, setShowAddProject] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const keys = await window.storage.list('project:');
      if (keys && keys.keys) {
        const loadedProjects = await Promise.all(
          keys.keys.map(async (key) => {
            const result = await window.storage.get(key);
            return result ? JSON.parse(result.value) : null;
          })
        );
        setProjects(loadedProjects.filter(p => p !== null));
      }
    } catch (error) {
      console.log('No existing projects');
    }
  };

  const saveProject = async (project) => {
    try {
      await window.storage.set(`project:${project.id}`, JSON.stringify(project));
      await loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const addProject = (name, address, headerImage) => {
    const newProject = {
      id: Date.now().toString(),
      name,
      address,
      headerImage: headerImage || null,
      documents: [],
      photos: [],
      selections: {},
      plans: [],
      punchList: [],
      createdAt: new Date().toISOString()
    };
    saveProject(newProject);
    setShowAddProject(false);
  };

  const updateProjectHeader = async (headerImage) => {
    const updated = {
      ...selectedProject,
      headerImage
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const addItem = async (type, name, data) => {
    const updated = {
      ...selectedProject,
      [type]: [...selectedProject[type], { id: Date.now(), name, data, date: new Date().toISOString() }]
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const addPunchListItem = async (description, location) => {
    const updated = {
      ...selectedProject,
      punchList: [...selectedProject.punchList, { 
        id: Date.now(), 
        description, 
        location, 
        completed: false, 
        date: new Date().toISOString() 
      }]
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const togglePunchListItem = async (itemId) => {
    const updated = {
      ...selectedProject,
      punchList: selectedProject.punchList.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const deleteItem = async (type, id) => {
    const updated = {
      ...selectedProject,
      [type]: selectedProject[type].filter(item => item.id !== id)
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const addSelectionGroup = async (groupName) => {
    const updated = {
      ...selectedProject,
      selections: {
        ...selectedProject.selections,
        [groupName]: []
      }
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const addSelectionToGroup = async (groupName, itemName, data) => {
    const updated = {
      ...selectedProject,
      selections: {
        ...selectedProject.selections,
        [groupName]: [
          ...(selectedProject.selections[groupName] || []),
          { id: Date.now(), name: itemName, data, date: new Date().toISOString() }
        ]
      }
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const deleteSelectionFromGroup = async (groupName, itemId) => {
    const updated = {
      ...selectedProject,
      selections: {
        ...selectedProject.selections,
        [groupName]: selectedProject.selections[groupName].filter(item => item.id !== itemId)
      }
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  const deleteSelectionGroup = async (groupName) => {
    const { [groupName]: removed, ...restSelections } = selectedProject.selections;
    const updated = {
      ...selectedProject,
      selections: restSelections
    };
    await saveProject(updated);
    setSelectedProject(updated);
  };

  if (showAddProject) {
    return <AddProjectForm onAdd={addProject} onCancel={() => setShowAddProject(false)} />;
  }

  if (selectedProject && view !== 'list' && view !== 'categories') {
    if (view === 'selections') {
      return (
        <SelectionsView
          project={selectedProject}
          onBack={() => setView('categories')}
          onAddGroup={addSelectionGroup}
          onAddItem={addSelectionToGroup}
          onDeleteItem={deleteSelectionFromGroup}
          onDeleteGroup={deleteSelectionGroup}
        />
      );
    }
    if (view === 'punchList') {
      return (
        <PunchListView
          project={selectedProject}
          onBack={() => setView('categories')}
          onAddItem={addPunchListItem}
          onToggleItem={togglePunchListItem}
          onDeleteItem={(id) => deleteItem('punchList', id)}
        />
      );
    }
    return (
      <ProjectDetail 
        project={selectedProject} 
        view={view}
        onBack={() => setView('categories')}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
      />
    );
  }

  if (selectedProject && view === 'categories') {
    return <ProjectCategories 
      project={selectedProject} 
      onBack={() => { setSelectedProject(null); setView('list'); }} 
      onSelectCategory={(cat) => setView(cat)}
      onUpdateHeader={updateProjectHeader}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative backdrop-blur-sm bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Hammer size={32} className="animate-pulse" />
          <h1 className="text-3xl font-black tracking-tight">Projects</h1>
        </div>
        <p className="text-orange-100 text-sm font-medium">Construction Management</p>
      </div>

      <div className="relative p-4">
        <button
          onClick={() => setShowAddProject(true)}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 rounded-2xl mb-6 flex items-center justify-center gap-3 font-bold shadow-2xl active:scale-95 transition-transform duration-200 hover:shadow-orange-500/50"
        >
          <Plus size={24} strokeWidth={3} />
          New Project
        </button>

        <div className="space-y-4">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              onClick={() => { setSelectedProject(project); setView('categories'); }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50 active:scale-98 transition-all duration-200 hover:border-orange-500/50"
              style={{
                animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`
              }}
            >
              {project.headerImage && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={project.headerImage} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-white mb-1">{project.name}</h3>
                    <p className="text-slate-400 text-sm mb-3">{project.address}</p>
                    <div className="flex gap-4 text-xs flex-wrap">
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-semibold">
                        {project.documents.length} docs
                      </span>
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-semibold">
                        {project.photos.length} photos
                      </span>
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-semibold">
                        {project.plans.length} plans
                      </span>
                      <span className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full font-semibold">
                        {Object.keys(project.selections || {}).length} groups
                      </span>
                      <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full font-semibold">
                        {(project.punchList || []).filter(item => !item.completed).length} pending
                      </span>
                    </div>
                  </div>
                  <div className="bg-orange-500/20 p-3 rounded-xl">
                    <ChevronRight className="text-orange-400" size={24} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
              <Home size={48} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-2">Tap above to add your first project</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function AddProjectForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [headerImage, setHeaderImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHeaderImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (name && address) {
      onAdd(name, address, headerImage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-6 shadow-2xl">
        <button onClick={onCancel} className="mb-3 bg-white/20 p-2 rounded-xl active:scale-95 transition-transform">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black">New Project</h1>
      </div>

      <div className="relative p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-3 ml-1">Project Photo (Optional)</label>
          {headerImage ? (
            <div className="relative">
              <img src={headerImage} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
              <button 
                onClick={() => setHeaderImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="header-upload"
              />
              <label htmlFor="header-upload" className="cursor-pointer">
                <Image size={48} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">Tap to add project photo</p>
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-3 ml-1">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="Smith Residence"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-3 ml-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="123 Main St, Austin, TX"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform duration-200 mt-8"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}

function ProjectCategories({ project, onBack, onSelectCategory, onUpdateHeader }) {
  const [showHeaderUpload, setShowHeaderUpload] = useState(false);

  const handleHeaderUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdateHeader(event.target.result);
        setShowHeaderUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    { id: 'documents', label: 'Documents', icon: FileText, gradient: 'from-blue-500 to-blue-600' },
    { id: 'plans', label: 'Plans', icon: Clipboard, gradient: 'from-green-500 to-emerald-600' },
    { id: 'selections', label: 'Selections', icon: Clipboard, gradient: 'from-purple-500 to-violet-600' },
    { id: 'photos', label: 'Photos', icon: Image, gradient: 'from-orange-500 to-amber-600' },
    { id: 'punchList', label: 'Punch List', icon: CheckSquare, gradient: 'from-red-500 to-rose-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {project.headerImage ? (
        <div className="relative h-64 overflow-hidden">
          <img 
            src={project.headerImage} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900"></div>
          <button 
            onClick={onBack} 
            className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm p-2 rounded-xl active:scale-95 transition-transform"
          >
            <ArrowLeft size={24} strokeWidth={3} className="text-white" />
          </button>
          <button 
            onClick={() => setShowHeaderUpload(true)} 
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-xl active:scale-95 transition-transform"
          >
            <Image size={24} strokeWidth={3} className="text-white" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-black text-white drop-shadow-lg">{project.name}</h1>
            <p className="text-white/90 text-sm font-medium drop-shadow">{project.address}</p>
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-6 shadow-2xl">
          <button onClick={onBack} className="mb-3 bg-white/20 p-2 rounded-xl active:scale-95 transition-transform">
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black mb-1">{project.name}</h1>
              <p className="text-orange-100 text-sm font-medium">{project.address}</p>
            </div>
            <button 
              onClick={() => setShowHeaderUpload(true)} 
              className="bg-white/20 p-2 rounded-xl active:scale-95 transition-transform"
            >
              <Image size={24} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {showHeaderUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-white font-bold text-xl mb-4">Update Project Photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleHeaderUpload}
              className="w-full text-slate-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-orange-500 file:text-white file:font-semibold mb-4"
            />
            <button 
              onClick={() => setShowHeaderUpload(false)}
              className="w-full bg-slate-700 text-white p-3 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative p-4 grid grid-cols-2 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          let count = 0;
          let label = '';
          if (cat.id === 'selections') {
            count = Object.keys(project.selections || {}).length;
            label = `${count} groups`;
          } else if (cat.id === 'punchList') {
            const pending = (project.punchList || []).filter(item => !item.completed).length;
            count = pending;
            label = `${pending} pending`;
          } else {
            count = project[cat.id].length;
            label = `${count} items`;
          }
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`bg-gradient-to-br ${cat.gradient} p-6 rounded-2xl shadow-2xl active:scale-95 transition-all duration-200 border border-white/10`}
              style={{
                animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`
              }}
            >
              <Icon className="text-white mb-3" size={36} strokeWidth={2.5} />
              <h3 className="font-black text-white text-lg">{cat.label}</h3>
              <p className="text-sm text-white/80 font-semibold mt-1">{label}</p>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function PunchListView({ project, onBack, onAddItem, onToggleItem, onDeleteItem }) {
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleAdd = () => {
    if (description.trim() && location.trim()) {
      onAddItem(description.trim(), location.trim());
      setDescription('');
      setLocation('');
      setShowAdd(false);
    }
  };

  const items = project.punchList || [];
  const pending = items.filter(item => !item.completed);
  const completed = items.filter(item => item.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 shadow-2xl">
        <button onClick={onBack} className="mb-3 bg-white/20 p-2 rounded-xl active:scale-95 transition-transform">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-black mb-1">Punch List</h1>
        <p className="text-sm font-medium opacity-90">{project.name}</p>
        <div className="mt-3 flex gap-3 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full font-semibold">{pending.length} Pending</span>
          <span className="bg-white/20 px-3 py-1 rounded-full font-semibold">{completed.length} Done</span>
        </div>
      </div>

      <div className="relative p-4">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white p-5 rounded-2xl mb-6 flex items-center justify-center gap-3 font-bold shadow-2xl active:scale-95 transition-transform"
        >
          <Plus size={20} strokeWidth={3} />
          Add Item
        </button>

        {showAdd && (
          <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl mb-6 border border-slate-700">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full p-3 mb-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g., Master Bathroom, Kitchen)"
              className="w-full p-3 mb-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleAdd}
                className="flex-1 bg-red-500 text-white p-3 rounded-xl font-semibold"
              >
                Add
              </button>
              <button 
                onClick={() => { setShowAdd(false); setDescription(''); setLocation(''); }}
                className="flex-1 bg-slate-700 text-white p-3 rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-bold text-lg mb-3 ml-1">Pending</h2>
            <div className="space-y-3">
              {pending.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-lg"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className="mt-1 w-6 h-6 rounded border-2 border-slate-600 flex items-center justify-center active:scale-95 transition-transform"
                    >
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{item.description}</p>
                      <p className="text-sm text-slate-400 mt-1">{item.location}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => onDeleteItem(item.id)} 
                      className="text-red-400 bg-red-500/10 p-2 rounded-xl active:scale-95 transition-transform"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-lg mb-3 ml-1">Completed</h2>
            <div className="space-y-3">
              {completed.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl shadow-lg opacity-60"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className="mt-1 w-6 h-6 rounded bg-green-500 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <CheckSquare size={16} className="text-white" strokeWidth={3} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white line-through">{item.description}</p>
                      <p className="text-sm text-slate-400 mt-1">{item.location}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => onDeleteItem(item.id)} 
                      className="text-red-400 bg-red-500/10 p-2 rounded-xl active:scale-95 transition-transform"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <CheckSquare size={40} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No punch list items yet</p>
            <p className="text-sm mt-2">Add items that need attention before completion</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function SelectionsView({ project, onBack, onAddGroup, onAddItem, onDeleteItem, onDeleteGroup }) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const presetGroups = [
    'Front Door Selection',
    'Porch and Patio Finishes',
    'Fireplace Selections',
    'Stucco, Stone and Roof',
    'Flooring Types',
    'Windows',
    'Floor Plug Locations',
    'Plumbing Fixtures',
    'Appliances',
    'Garage Door',
    'Cabinet Drawings',
    'Electrical Layout',
    'Paint Colors',
    'Trim Selection',
    'Countertops',
    'Tile',
    'Lighting',
    'Hardware',
    'Glass/Mirror',
    'Carpet',
    'Landscape Design'
  ];

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setShowAddGroup(false);
    }
  };

  const handleAddPresetGroup = (presetName) => {
    onAddGroup(presetName);
    setShowPresets(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedGroup) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        await onAddItem(selectedGroup, uploadName || file.name, event.target.result);
        setShowUpload(false);
        setUploadName('');
      };
      reader.readAsDataURL(file);
    }
  };

  if (selectedGroup) {
    const items = project.selections[selectedGroup] || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative bg-gradient-to-r from-purple-500 to-violet-600 text-white p-6 shadow-2xl">
          <button onClick={() => setSelectedGroup(null)} className="mb-3 bg-white/20 p-2 rounded-xl active:scale-95 transition-transform">
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <h1 className="text-2xl font-black mb-1">{selectedGroup}</h1>
          <p className="text-sm font-medium opacity-90">{project.name}</p>
        </div>

        <div className="relative p-4">
          <button
            onClick={() => setShowUpload(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white p-5 rounded-2xl mb-6 flex items-center justify-center gap-3 font-bold shadow-2xl active:scale-95 transition-transform"
          >
            <Upload size={20} strokeWidth={3} />
            Add Item
          </button>

          {showUpload && (
            <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl mb-6 border border-slate-700">
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Item name (optional)"
                className="w-full p-3 mb-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="file"
                onChange={handleFileUpload}
                className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-500 file:text-white file:font-semibold"
              />
              <button onClick={() => setShowUpload(false)} className="mt-3 text-red-400 font-semibold">Cancel</button>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-lg flex justify-between items-center"
                style={{
                  animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => onDeleteItem(selectedGroup, item.id)} 
                  className="text-red-400 ml-3 bg-red-500/10 p-2 rounded-xl active:scale-95 transition-transform"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <Clipboard size={40} className="opacity-50" />
              </div>
              <p className="text-lg font-medium">No items yet</p>
              <p className="text-sm mt-2">Tap above to add your first item</p>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  const groups = Object.keys(project.selections || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative bg-gradient-to-r from-purple-500 to-violet-600 text-white p-6 shadow-2xl">
        <button onClick={onBack} className="mb-3 bg-white/20 p-2 rounded-xl active:scale-95 transition-transform">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-black mb-1">Selections</h1>
        <p className="text-sm font-medium opacity-90">{project.name}</p>
      </div>

      <div className="relative p-4">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowPresets(true)}
            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white p-5 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-2xl active:scale-95 transition-transform"
          >
            <Clipboard size={24} strokeWidth={3} />
            Quick Add
          </button>
          <button
            onClick={() => setShowAddGroup(true)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white p-5 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-2xl active:scale-95 transition-transform"
          >
            <FolderPlus size={24} strokeWidth={3} />
            Custom
          </button>
        </div>

        {showPresets && (
          <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl mb-6 border border-slate-700 max-h-96 overflow-y-auto">
            <h3 className="text-white font-bold mb-3 text-lg">Quick Add Groups</h3>
            <div className="space-y-2">
              {presetGroups.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleAddPresetGroup(preset)}
                  className="w-full text-left p-3 bg-slate-900 hover:bg-slate-750 rounded-xl text-white font-medium active:scale-98 transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowPresets(false)}
              className="w-full mt-4 bg-slate-700 text-white p-3 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        )}

        {showAddGroup && (
          <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl mb-6 border border-slate-700">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name (e.g., Flooring, Cabinets, Lighting)"
              className="w-full p-3 mb-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleAddGroup}
                className="flex-1 bg-purple-500 text-white p-3 rounded-xl font-semibold"
              >
                Create
              </button>
              <button 
                onClick={() => { setShowAddGroup(false); setNewGroupName(''); }}
                className="flex-1 bg-slate-700 text-white p-3 rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {groups.map((group, idx) => {
            const itemCount = project.selections[group].length;
            return (
              <div
                key={group}
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg overflow-hidden"
                style={{
                  animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                }}
              >
                <div 
                  onClick={() => setSelectedGroup(group)}
                  className="p-4 flex justify-between items-center active:bg-slate-750"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{group}</h3>
                    <p className="text-slate-400 text-sm mt-1">{itemCount} items</p>
                  </div>
                  <ChevronRight className="text-purple-400" size={24} strokeWidth={3} />
                </div>
                <button
                  onClick={() => onDeleteGroup(group)}
                  className="w-full bg-red-500/10 text-red-400 p-3 text-sm font-semibold border-t border-slate-700 active:bg-red-500/20"
                >
                  Delete Group
                </button>
              </div>
            );
          })}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <FolderPlus size={40} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No groups yet</p>
            <p className="text-sm mt-2">Create groups like "Flooring", "Cabinets", "Lighting"</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function ProjectDetail({ project, view, onBack, onAddItem, onDeleteItem }) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');

  const categories = {
    documents: { label: 'Documents', icon: FileText, gradient: 'from-blue-500 to-blue-600' },
    plans: { label: 'Plans', icon: Clipboard, gradient: 'from-green-500 to-emerald-600' },
    photos: { label: 'Photos', icon: Image, gradient: 'from-orange-500 to-amber-600' }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        await onAddItem(type, uploadName || file.name, event.target.result);
        setShowUpload(false);
        setUploadName('');
      };
      reader.readAsDataURL(file);
    }
  };

  const currentCategory = categories[view];
  const items = project[view] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className={`relative bg-gradient-to-r ${currentCategory.gradient} text-white p-6 shadow-2xl`}>
        <button onClick={() => onBack()} className="mb-3 bg-white/20 p-2 rounded-xl active:scale-95 transition-transform">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-black mb-1">{currentCategory.label}</h1>
        <p className="text-sm font-medium opacity-90">{project.name}</p>
      </div>

      <div className="relative p-4">
        <button
          onClick={() => setShowUpload(true)}
          className={`w-full bg-gradient-to-r ${currentCategory.gradient} text-white p-5 rounded-2xl mb-6 flex items-center justify-center gap-3 font-bold shadow-2xl active:scale-95 transition-transform`}
        >
          <Upload size={20} strokeWidth={3} />
          Add {currentCategory.label}
        </button>

        {showUpload && (
          <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl mb-6 border border-slate-700">
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Item name (optional)"
              className="w-full p-3 mb-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, view)}
              className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-500 file:text-white file:font-semibold"
              accept={view === 'photos' ? 'image/*' : '*'}
            />
            <button onClick={() => setShowUpload(false)} className="mt-3 text-red-400 font-semibold">Cancel</button>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div 
              key={item.id} 
              className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-lg flex justify-between items-center"
              style={{
                animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(item.date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => onDeleteItem(view, item.id)} 
                className="text-red-400 ml-3 bg-red-500/10 p-2 rounded-xl active:scale-95 transition-transform"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <currentCategory.icon size={40} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No {currentCategory.label.toLowerCase()} yet</p>
            <p className="text-sm mt-2">Tap above to add your first item</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
