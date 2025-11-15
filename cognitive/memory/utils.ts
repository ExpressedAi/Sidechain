export function makeRatingKey(memoryId: string, kernelId: string): string {
  return `${kernelId}::${memoryId}`;
}
