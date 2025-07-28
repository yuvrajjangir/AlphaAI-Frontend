import React, { useEffect, useState } from 'react';
import { CreatePersonForm } from './CreatePersonForm';
import { CreateCompanyForm } from './CreateCompanyForm';
import { apiFetch } from '../utils/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_API_KEY = import.meta.env.VITE_AUTH_API_KEY;

interface Person {
  id: number;
  fullName: string;
  title: string;
  companyId: number;
  company?: {
    name: string;
    domain: string;
  };
}

interface ResearchResults {
  companyValueProp: string;
  productNames: string[];
  pricingModel: string;
  keyCompetitors: string[];
}

export const PeopleList: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPeople();
  }, []); 

  const fetchPeople = async () => {
    try {
      const response = await apiFetch('/people');
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonCreated = () => {
    setShowAddPerson(false);
    fetchPeople();
  };

  const handleCompanyCreated = () => {
    setShowAddCompany(false);
    fetchPeople();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin h-12 w-12 mx-auto border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">People</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                {view === 'grid' ? (
                  <span>Switch to List View</span>
                ) : (
                  <span>Switch to Grid View</span>
                )}
              </button>
              <button
                onClick={() => setShowAddCompany(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
              >
                Add Company
              </button>
              <button
                onClick={() => setShowAddPerson(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>

        {showAddPerson && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative">
              <CreatePersonForm
                onPersonCreated={handlePersonCreated}
                onCancel={() => setShowAddPerson(false)}
              />
            </div>
          </div>
        )}

        {showAddCompany && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative">
              <CreateCompanyForm
                onCompanyCreated={handleCompanyCreated}
                onCancel={() => setShowAddCompany(false)}
              />
            </div>
          </div>
        )}

        {people.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No people found. Add some people to get started!</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
            "space-y-4"
          }>
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PersonCardProps {
  person: Person;
}

const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<ResearchResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const handleComplete = () => {
      setTimeout(() => {
        fetchResults();
      }, 1000);
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };

    try {
      eventSource = new EventSource(`${API_BASE_URL}/events/jobs/${jobId}?apiKey=${AUTH_API_KEY}`);;
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress(data.progress || 0);
        if (data.state === 'completed') {
          handleComplete();
        }
      };
      eventSource.onerror = () => {
        console.warn('SSE failed, switching to polling...');
        eventSource?.close();
        pollInterval = startPolling(jobId, handleComplete);
      };
    } catch {
      pollInterval = startPolling(jobId, handleComplete);
    }

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobId]);

  const startPolling = (jobId: string, onComplete: () => void) => {
    return setInterval(async () => {
      try {
        const res = await apiFetch(`/research/jobs/${jobId}`);
        const data = await res.json();
        setProgress(data.progress || 0);
        if (data.state === 'completed') {
          onComplete();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  const fetchResults = async () => {
  try {
    const res = await apiFetch(`/snippets/company/${person.companyId}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      setResults(data[data.length - 1]);
    } else {
      setResults(null);
    }
  } catch (err) {
    console.error('Error fetching results:', err);
    setResults(null);
  }
};


  const handleResearch = async () => {
    setResults(null);
    setProgress(0);
    setErrorMessage(null);
    
    try {
      const response = await apiFetch(`/enrich/${person.id}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.isExisting) {
        setResults(data.data);
        setProgress(100);
      } else {
        setJobId(data.jobId);
      }
    } catch (error) {
      console.error('Error starting research:', error);
      setErrorMessage('Failed to start research');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{person.fullName}</h3>
          <p className="text-gray-600">{person.title}</p>
        </div>
        <button
          onClick={handleResearch}
          disabled={!!jobId && progress < 100}
          className={`px-4 py-2 rounded text-white font-medium transition ${
            jobId && progress < 100
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {jobId && progress < 100 ? 'Researching...' : 'Research'}
        </button>
      </div>

      {jobId && progress < 100 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Progress: {progress}%</p>
        </div>
      )}

      {results && (
        <div className="mt-4 bg-gray-50 rounded p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800">Company Value Proposition</h4>
            <p className="text-gray-700">{results.companyValueProp || 'Not available'}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800">Products / Services</h4>
            <ul className="list-disc list-inside text-gray-700">
              {(results.productNames || []).map((product, index) => (
                <li key={index}>{product}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800">Pricing Model</h4>
            <p className="text-gray-700">{results.pricingModel || 'Not available'}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800">Key Competitors</h4>
            <ul className="list-disc list-inside text-gray-700">
              {(results.keyCompetitors || []).map((competitor, index) => (
                <li key={index}>{competitor}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
