import React, { useEffect, useState } from 'react';

interface Person {
  id: number;
  fullName: string;
  title: string;
  companyId: number;
}

interface ResearchResults {
  companyValueProp: string;
  productNames: string[];
  pricingModel: string;
  keyCompetitors: string[];
  topLinks: string[];
}

export const PeopleList: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/people');
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto p-4">
      {people.map((person) => (
        <PersonCard key={person.id} person={person} />
      ))}
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
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/snippets/company/${person.companyId}`);
      const data = await response.json();
      setResults(data[0] || null);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch results');
    }
  };

  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/research/jobs/${jobId}`);
        const data = await response.json();
        setProgress(data.progress || 0);
        
        if (data.state === 'completed') {
          clearInterval(interval);
          await fetchResults();
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setError('Error checking research status');
        clearInterval(interval);
      }
    }, 3000);

    return interval;
  };

  const handleResearch = async () => {
    setResults(null);
    setProgress(0);
    setError(null);
    
    try {
      const response = await fetch(`/api/enrich/${person.id}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.isExisting) {
        // Research already exists, show it immediately
        setResults(data.data);
        setProgress(100);
      } else {
        // New research started
        setJobId(data.jobId);
        monitorJobProgress(data.jobId);
      }
    } catch (error) {
      console.error('Error starting research:', error);
      setError('Failed to start research');
    }
  };

  const monitorJobProgress = (jobId: string) => {
    try {
      const eventSource = new EventSource(`/api/events/jobs/${jobId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress(data.progress || 0);
        if (data.state === 'completed') {
          fetchResults();
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        const interval = startPolling(jobId);
        return () => clearInterval(interval);
      };
    } catch {
      const interval = startPolling(jobId);
      return () => clearInterval(interval);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">{person.fullName}</h3>
          <p className="text-gray-600">{person.title}</p>
        </div>
        <button
          onClick={handleResearch}
          disabled={!!jobId && progress < 100}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {jobId && progress < 100 ? 'Researching...' : 'Research'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {jobId && progress < 100 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Progress: {progress}%</p>
        </div>
      )}

      {results && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Research Results</h4>
          <div className="bg-gray-50 rounded p-4">
            <p className="font-medium">Company Value Proposition</p>
            <p className="text-gray-700 mb-2">{results.companyValueProp}</p>
            
            <p className="font-medium mt-3">Products/Services</p>
            <ul className="list-disc list-inside text-gray-700 mb-2">
              {results.productNames.map((product: string, index: number) => (
                <li key={index}>{product}</li>
              ))}
            </ul>

            <p className="font-medium mt-3">Pricing Model</p>
            <p className="text-gray-700 mb-2">{results.pricingModel}</p>

            <p className="font-medium mt-3">Key Competitors</p>
            <ul className="list-disc list-inside text-gray-700">
              {results.keyCompetitors.map((competitor: string, index: number) => (
                <li key={index}>{competitor}</li>
              ))}
            </ul>

            {results.topLinks && results.topLinks.length > 0 && (
              <div className="mt-3">
                <p className="font-medium">Top Links</p>
                <ul className="list-disc list-inside text-blue-600">
                  {results.topLinks.map((link: string, index: number) => (
                    <li key={index}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
