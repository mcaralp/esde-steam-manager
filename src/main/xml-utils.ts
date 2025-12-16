export function isXmlObject(obj: any): obj is object
{
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj)
}

export function isXmlArray(obj: any): obj is Array<any>
{
    return Array.isArray(obj)
}
