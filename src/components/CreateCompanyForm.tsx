import React, { useState, useEffect } from 'react';
import type { Company, Campaign } from '../types/company';
import { CreateCampaignForm } from './CreateCampaignForm';
import { apiFetch } from '../utils/api';

interface CreateCompanyFormProps {
  onCompanyCreated: () => void;
  onCancel: () => void;
}

export const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({
  onCompanyCreated,
  onCancel,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [campaignId, setCampaignId] = useState<number | ''>('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const response = await apiFetch('/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns');
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          website,
          campaignId: campaignId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create company');
      }

      onCompanyCreated();
      setCompanyName('');
      setWebsite('');
      setCampaignId('');
    } catch (error) {
      console.error('Error creating company:', error);
      setError('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignCreated = () => {
    setShowCampaignForm(false);
    fetchCampaigns();
  };

  if (showCampaignForm) {
    return (
      <CreateCampaignForm
        onCampaignCreated={handleCampaignCreated}
        onCancel={() => setShowCampaignForm(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Company</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="campaign" className="block text-sm font-medium text-gray-700">
              Campaign
            </label>
            <button
              type="button"
              onClick={() => setShowCampaignForm(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add New Campaign
            </button>
          </div>
          <select
            id="campaign"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Company Domain *
          </label>
          <input
            type="text"
            id="domain"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
};
