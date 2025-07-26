export interface Company {
    id?: number;
    name: string;
    website: string;
    campaignId?: number;
}

export interface Campaign {
    id: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ContextSnippet {
    id?: number;
    companyId: number;
    personId?: number;
    companyValueProp: string;
    productNames: string[];
    pricingModel: string;
    keyCompetitors: string[];
    companyDomain: string;
    createdAt?: Date;
    updatedAt?: Date;
}
