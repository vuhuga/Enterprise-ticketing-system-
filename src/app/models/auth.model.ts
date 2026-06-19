import { User } from './user.model';

/**
 * Authentication Models
 * 
 * Interfaces for authentication-related API requests and responses.
 */

/**
 * Payload for user login request
 */
export interface LoginRequest {
    /**
     * User's email address
     */
    email: string;

    /**
     * User's password
     */
    password: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
    /**
     * Success message
     */
    message: string;

    /**
     * JWT authentication token
     */
    token: string;

    /**
     * Authenticated user details
     */
    user: User;
}

/**
 * Payload for user registration request
 */
export interface RegisterRequest {
    /**
     * User's first name
     */
    first_name: string;

    /**
     * User's last name
     */
    last_name: string;

    /**
     * User's email address
     */
    email: string;

    /**
     * User's password
     */
    password: string;

    /**
     * Optional phone number
     */
    phone?: string;

    /**
     * Optional city
     */
    city?: string;

    /**
     * Optional country
     */
    country?: string;

    /**
     * Optional address
     */
    address?: string;
}

/**
 * Response from successful registration
 */
export interface RegisterResponse {
    /**
     * Success message
     */
    message: string;

    /**
     * Created user details
     */
    user: User;
}
