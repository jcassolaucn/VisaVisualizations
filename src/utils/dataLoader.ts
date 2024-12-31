import Papa from "papaparse";

// Define a generic type for the parsed CSV data
export interface CSVRow {
  year: string; // CSV files will often have string columns initially
  [key: string]: string; // Allow dynamic keys for other columns
}

/**
 * Fetch and parse a CSV file.
 * @param {string} filePath - The path to the CSV file.
 * @returns {Promise<CSVRow[]>} - Parsed data as an array of objects.
 */
export const fetchCSVData = async (filePath: string): Promise<CSVRow[]> => {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
  }

  const csvText = await response.text();

  return new Promise<CSVRow[]>((resolve, reject) => {
    Papa.parse<CSVRow>(csvText, {
      header: true, // Treat the first row as column headers
      skipEmptyLines: true,
      complete: (result: any) => {
        if (result.errors.length > 0) {
          reject(new Error("Error parsing CSV data"));
        } else {
          resolve(result.data);
        }
      },
    });
  });
};
