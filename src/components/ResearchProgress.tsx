import React, { useEffect, useState } from 'react';
import type { ContextSnippet } from '../types/company';

interface ResearchProgressProps {
  jobId: string;
  personId: number;
  onComplete: () => void;
}

export const ResearchProgress: React.FC<ResearchProgressProps> = ({
  jobId,
  personId,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContextSnippet | null>(null);

  useEffect(() => {
    const fetchResultsData = async () => {
      try {
        const response = await fetch(`/api/snippets/person/${personId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
        onComplete();
      } catch (err) {
        setError('Failed to load results');
      }
    };

    // Set up SSE connection
    const eventSource = new EventSource(`/api/events/jobs/${jobId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress || 0);
      setStatus(data.status);

      if (['completed', 'failed'].includes(data.status)) {
        eventSource.close();
        if (data.status === 'completed') {
          fetchResultsData();
        }
      }
    };

    eventSource.onerror = () => {
      setError('Lost connection to server');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId, personId, onComplete]);



  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-700">Research Progress</div>
          <div className="mt-1 relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-1">{status}</div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      {results && (
        <div className="bg-white rounded-lg p-4 shadow space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Research Results</h3>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700">Value Proposition</h4>
            <p className="text-sm text-gray-600">{results.companyValueProp}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Products</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              {results.productNames.map((product: string, index: number) => (
                <li key={index}>{product}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Pricing Model</h4>
            <p className="text-sm text-gray-600">{results.pricingModel}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Key Competitors</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              {results.keyCompetitors.map((competitor: string, index: number) => (
                <li key={index}>{competitor}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Company Domain</h4>
            <p className="text-sm text-gray-600">{results.companyDomain}</p>
          </div>
        </div>
      )}
    </div>
  );
};
