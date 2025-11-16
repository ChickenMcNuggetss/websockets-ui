export function parseData(fixedData: any) {
  if (typeof fixedData === 'string') {
    try {
      return JSON.parse(fixedData);
    } catch (_) {
      console.log('Error in parsing');
    }
  }
  return fixedData;
}
