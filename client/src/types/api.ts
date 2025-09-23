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

export interface MethodInfo {
    name: string;
    required_params: string[];
    optional_params: string[];
    input_type: string;
}

export interface Resource {
    Name: string;
    ShortNames?: string[];
    Verbs: string[];
    Methods?: Record<string, MethodInfo>;
}

export interface Parameter {
    key: string;
    value: string;
}

export interface APIConfig {
    baseURL: string;
}
