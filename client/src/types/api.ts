export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
        details?: string;
    };
    duration: string;
}

export interface Service {
    name: string;
}

export interface Resource {
    Name: string;
    ShortNames?: string[];
    Verbs: string[];
}

export interface Parameter {
    key: string;
    value: string;
}

export interface APIConfig {
    baseURL: string;
}
