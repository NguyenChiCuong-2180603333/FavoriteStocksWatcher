import ShareService from '../services/shareService';
import api from '../services/api';

jest.mock('../services/api');

describe('ShareService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shareMyFavorites', () => {
    test('should share favorites successfully', async () => {
      const recipientEmail = 'friend@example.com';
      const mockResponse = { data: { message: 'Shared successfully' } };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await ShareService.shareMyFavorites(recipientEmail);

      expect(api.post).toHaveBeenCalledWith('/shares', { recipientEmail });
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error if sharing API call fails', async () => {
      const recipientEmail = 'friend@example.com';
      const errorMessage = 'Sharing failed';
      api.post.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

      await expect(ShareService.shareMyFavorites(recipientEmail)).rejects.toEqual({ message: errorMessage });
    });
  });

  describe('getListsSharedWithMe', () => {
    test('should fetch lists shared with user successfully', async () => {
      const mockData = [{ shareId: '1', sharerInfo: { name: 'Friend' } }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await ShareService.getListsSharedWithMe();

      expect(api.get).toHaveBeenCalledWith('/shares/with-me');
      expect(result).toEqual(mockData);
    });
  });

  describe('getMySharedInstances', () => {
    test('should fetch user\'s shared instances successfully', async () => {
      const mockData = [{ shareId: 's1', recipientEmail: 'test@test.com' }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await ShareService.getMySharedInstances();
      expect(api.get).toHaveBeenCalledWith('/shares/my-shares');
      expect(result).toEqual(mockData);
    });
  });

   describe('unshareList', () => {
    test('should unshare a list successfully', async () => {
      const shareId = 'shareId123';
      const mockResponse = { data: { message: 'Unshared successfully' } };
      api.delete.mockResolvedValueOnce(mockResponse);

      const result = await ShareService.unshareList(shareId);
      expect(api.delete).toHaveBeenCalledWith(`/shares/${shareId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});