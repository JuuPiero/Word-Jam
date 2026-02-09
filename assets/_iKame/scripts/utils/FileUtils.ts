import { resources, TextAsset, Vec3 } from "cc";

export function readCSVFile(filePath: string): string[][] {
    resources.load('data/myfile', TextAsset, (err, asset) =>
    {
        if (err)
        {
            console.error('Failed to load CSV:', err);
            return;
        }

        const csvText = asset.text;
        const rows = parseCSV(csvText);
        return rows;
    });
    return [];
}

function parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/);
    return lines.map(line => line.split(','));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer
{
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++)
    {
        bytes[ i ] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}
