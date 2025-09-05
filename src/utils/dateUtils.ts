// Date utility functions for consistent date formatting across the application

/**
 * Formats a date string to DD/MM/YYYY format
 * Handles various input formats including ISO strings and timestamps
 * @param dateInput - Date string, timestamp, or Date object
 * @returns Formatted date string in DD/MM/YYYY format or fallback for invalid dates
 */
export const formatDateToDDMMYYYY = (dateInput: string | number | Date): string => {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      // Handle various string formats
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      // Handle timestamps - both milliseconds and seconds formats
      date = new Date(dateInput);
    } else {
      // Already a Date object
      date = dateInput;
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date input:', dateInput);
      return 'Date invalide';
    }
    
    // Check if the year is reasonable (between 1990 and current year + 10)
    const year = date.getFullYear();
    if (year < 1990 || year > new Date().getFullYear() + 10) {
      console.error('Date year out of reasonable range:', year, 'for input:', dateInput);
      return 'Date invalide';
    }
    
    // Format as DD/MM/YYYY
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
  } catch (error) {
    console.error('Date formatting error for input:', dateInput, error);
    return 'Date invalide';
  }
};

/**
 * Extracts year from a date string for grouping purposes
 * @param dateInput - Date string, timestamp, or Date object
 * @returns Year as string
 */
export const getYearFromDate = (dateInput: string | number | Date): string => {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date input for year extraction:', dateInput);
      return '????';
    }
    
    const year = date.getFullYear();
    if (year > 1990 && year <= new Date().getFullYear() + 10) {
      return year.toString();
    }
    
    console.error('Year out of reasonable range:', year, 'for input:', dateInput);
    return '????';
    
  } catch (error) {
    console.error('Year extraction error for input:', dateInput, error);
    return '????';
  }
};