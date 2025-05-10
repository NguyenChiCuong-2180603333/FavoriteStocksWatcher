import Share from '../models/Share.js';
import User from '../models/User.js'; 


export const shareMyFavorites = async (req, res) => {
  const { recipientEmail } = req.body;
  const sharerId = req.user._id; 

  if (!recipientEmail || typeof recipientEmail !== 'string' || recipientEmail.trim() === '') {
    return res.status(400).json({ message: 'Vui lòng cung cấp email người nhận hợp lệ.' });
  }

  const normalizedRecipientEmail = recipientEmail.trim().toLowerCase();

  if (req.user.email === normalizedRecipientEmail) {
    return res.status(400).json({ message: 'Bạn không thể tự chia sẻ cho chính mình.' });
  }

  try {
    // Kiểm tra xem người nhận có phải là user đã đăng ký không
     const recipientUser = await User.findOne({ email: normalizedRecipientEmail });

    // Kiểm tra xem đã chia sẻ cho email này chưa
    const existingShare = await Share.findOne({
      sharer: sharerId,
      recipientEmail: normalizedRecipientEmail,
    });

    if (existingShare) {
      return res.status(400).json({ message: `Bạn đã chia sẻ danh sách này với ${normalizedRecipientEmail} rồi.` });
    }

    const newShare = await Share.create({
      sharer: sharerId,
      recipientEmail: normalizedRecipientEmail,
      recipientUser: recipientUser ? recipientUser._id : null, 
    });

    res.status(201).json({
      message: `Đã chia sẻ danh sách yêu thích với ${normalizedRecipientEmail}.`,
      share: newShare,
    });
  } catch (error) {
    console.error('Lỗi khi chia sẻ danh sách:', error);
    if (error.code === 11000) { // Lỗi duplicate key từ unique index
        return res.status(400).json({ message: `Lỗi: Bạn đã chia sẻ danh sách này với ${normalizedRecipientEmail} rồi (từ index).` });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi chia sẻ danh sách.' });
  }
};


export const getListsSharedWithMe = async (req, res) => {
  const myEmail = req.user.email; 

  try {
    const shares = await Share.find({ recipientEmail: myEmail })
      .populate('sharer', 'name username email'); 

    if (!shares || shares.length === 0) {
      return res.json([]); 
    }


    const detailedSharedLists = await Promise.all(
      shares.map(async (share) => {
        if (!share.sharer) { 
            return {
                sharedBy: { name: 'Người dùng không xác định', username: 'N/A', email: 'N/A' },
                favoriteStocks: [],
                sharedAt: share.createdAt,
                shareId: share._id
            };
        }
    
        const sharerUserDoc = await User.findById(share.sharer._id);
        return {
          shareId: share._id, 
          sharerInfo: {
            _id: share.sharer._id,
            name: share.sharer.name,
            username: share.sharer.username,
            email: share.sharer.email,
          },
          favoriteStocks: sharerUserDoc ? sharerUserDoc.favoriteStocks : [],
          sharedAt: share.createdAt,
        };
      })
    );

    res.json(detailedSharedLists);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách được chia sẻ với tôi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};


export const getMySharedInstances = async (req, res) => {
  const sharerId = req.user._id;

  try {
    const myShares = await Share.find({ sharer: sharerId })
                                .select('recipientEmail createdAt'); // Chỉ lấy email người nhận và thời gian chia sẻ

    res.json(myShares);
  } catch (error) {
    console.error('Lỗi khi lấy các lượt chia sẻ của tôi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};


export const unshareList = async (req, res) => {
  const { shareId } = req.params;
  const sharerId = req.user._id;

  try {
    const share = await Share.findById(shareId);

    if (!share) {
      return res.status(404).json({ message: 'Không tìm thấy lượt chia sẻ này.' });
    }

    // Đảm bảo chỉ người chia sẻ mới có quyền xóa
    if (share.sharer.toString() !== sharerId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thu hồi lượt chia sẻ này.' });
    }

    await Share.findByIdAndDelete(shareId); 

    res.json({ message: `Đã thu hồi chia sẻ với ${share.recipientEmail}.` });
  } catch (error) {
    console.error('Lỗi khi thu hồi chia sẻ:', error);
    if (error.kind === 'ObjectId') { 
        return res.status(400).json({ message: 'ID lượt chia sẻ không hợp lệ.' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};
