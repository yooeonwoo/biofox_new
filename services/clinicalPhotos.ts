/**
 * Clinical Photos Service - Stub Implementation
 * TODO: Implement with Convex
 */

export const clinicalPhotosAPI = {
  async getCases() {
    console.warn('getCases not implemented');
    return [];
  },

  async getCase(id: string) {
    console.warn('getCase not implemented');
    return null;
  },

  async createCase(data: any) {
    console.warn('createCase not implemented');
    return { id: 'stub-id' };
  },

  async updateCase(id: string, data: any) {
    console.warn('updateCase not implemented');
    return true;
  },

  async deleteCase(id: string) {
    console.warn('deleteCase not implemented');
    return true;
  },

  async uploadPhoto(caseId: string, file: File) {
    console.warn('uploadPhoto not implemented');
    return { url: 'stub-url' };
  },

  async deletePhoto(photoId: string) {
    console.warn('deletePhoto not implemented');
    return true;
  },

  async uploadConsent(caseId: string, file: File) {
    console.warn('uploadConsent not implemented');
    return { url: 'stub-url' };
  },

  async deleteConsent(consentId: string) {
    console.warn('deleteConsent not implemented');
    return true;
  },
};
