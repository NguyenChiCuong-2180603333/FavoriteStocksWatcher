import api from './api';

const ShareService = {

 shareMyFavorites: async (recipientEmail) => {
    try {
      const response = await api.post('/shares', { recipientEmail });
      return response.data; 
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw error.response.data;
      }
      throw new Error(error.message || 'Không thể chia sẻ danh sách. Vui lòng thử lại.');
    }
  },

  getListsSharedWithMe: async () => {
    try {
      const response = await api.get('/shares/with-me');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách được chia sẻ với tôi:', error);
      throw error.response?.data || error;
    }
  },

  getMySharedInstances: async () => {
    try {
      const response = await api.get('/shares/my-shares');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy các lượt chia sẻ của tôi:', error);
      throw error.response?.data || error;
    }
  },
  unshareList: async (shareId) => {
    try {
      const response = await api.delete(`/shares/${shareId}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi thu hồi chia sẻ ID ${shareId}:`, error);
      throw error.response?.data || error;
    }
  },
};

export default ShareService;