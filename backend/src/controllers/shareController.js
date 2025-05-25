import Share from '../models/Share.js';
import User from '../models/User.js'; 

const isValidEmailFormat = (email) => {
  if (!email) return false;
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

export const shareMyFavorites = async (req, res) => {
  try {
    const sharerUserId = req.user._id;
    const { recipientEmail } = req.body;

    if (!recipientEmail || typeof recipientEmail !== 'string' || recipientEmail.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp email người nhận.' });
    }

    const trimmedEmail = recipientEmail.trim().toLowerCase();

    if (trimmedEmail.length > 256) {
      return res.status(400).json({ message: 'Email người nhận không được vượt quá 256 ký tự.' });
    }

    if (!isValidEmailFormat(trimmedEmail)) {
      return res.status(400).json({ message: 'Địa chỉ email người nhận không hợp lệ.' });
    }

    const sharerUser = await User.findById(sharerUserId).select('favoriteStocks email');
    if (!sharerUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người chia sẻ.' });
    }

    if (sharerUser.email === trimmedEmail) {
      return res.status(400).json({ message: 'Bạn không thể chia sẻ danh sách cho chính mình.' });
    }

    const recipientUser = await User.findOne({ email: trimmedEmail }).select('_id email'); 
    if (!recipientUser) {
      return res.status(404).json({ message: `Người dùng với email '${trimmedEmail}' không tồn tại trong hệ thống.` });
    }

    if (!sharerUser.favoriteStocks || sharerUser.favoriteStocks.length === 0) {
      return res.status(400).json({ message: 'Danh sách cổ phiếu yêu thích của bạn đang trống. Không thể chia sẻ.' });
    }

    const existingShare = await Share.findOne({
      sharer: sharerUser._id,
      recipientUser: recipientUser._id,
      status: 'active',
    });

    if (existingShare) {
      return res.status(409).json({
        message: `Bạn đã chia sẻ danh sách của mình với ${recipientUser.email} rồi.`,
      });
    }

    const newShare = new Share({
      sharer: sharerUser._id,
      recipientUser: recipientUser._id,
      sharedStocks: [...sharerUser.favoriteStocks],
      status: 'active',
    });

    await newShare.save();

    res.status(201).json({
      message: `Đã chia sẻ thành công danh sách cổ phiếu yêu thích của bạn với ${recipientUser.email}.`,
      shareDetails: newShare, 
    });

  } catch (error) {
    console.error('Lỗi khi chia sẻ danh sách cổ phiếu:', error);
    if (error.name === 'ValidationError') { 
        return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) { 
        return res.status(409).json({ message: `Bạn đã chia sẻ danh sách với người dùng này rồi và lượt chia sẻ đó đang hoạt động.` });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi thực hiện chia sẻ.' });
  }
};


export const getListsSharedWithMe = async (req, res) => {
  const myUserId = req.user._id;

  try {
    const shares = await Share.find({ recipientUser: myUserId, status: 'active' }) 
      .populate('sharer', 'name username email'); 

    if (!shares || shares.length === 0) {
      return res.json([]); 
    }


    const detailedSharedLists = await Promise.all(
      shares.map(async (share) => {
        if (!share.sharer) { 
            console.warn(`Share document ${share._id} thiếu thông tin sharer.`);
            return {
                sharerInfo: { name: 'Người dùng không xác định', username: 'N/A', email: 'N/A' },
                favoriteStocks: [],
                sharedAt: share.createdAt,
                shareId: share._id
            };
        }
    
        //const sharerUserDoc = await User.findById(share.sharer._id);
        return {
          shareId: share._id, 
          sharerInfo: {
            _id: share.sharer._id,
            name: share.sharer.name,
            username: share.sharer.username,
            email: share.sharer.email,
          },
          favoriteStocks: share.sharedStocks, 
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
    const mySharesRaw = await Share.find({ sharer: sharerId, status: 'active' }) // Lấy các chia sẻ đang active
                                  .populate('recipientUser', 'email name username') // Populate thông tin từ User model
                                  .select('recipientUser createdAt sharedStocks status') // Chọn các trường cần thiết
                                  .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu (tùy chọn)

    // Chuyển đổi dữ liệu để dễ sử dụng ở frontend
    const myShares = mySharesRaw.map(share => {
      let recipientDisplayEmail = 'N/A (Thông tin không có)';
      let recipientDisplayName = null;

      if (share.recipientUser) {
        recipientDisplayEmail = share.recipientUser.email;
        recipientDisplayName = share.recipientUser.name || share.recipientUser.username;
      } else if (share.recipientEmail) { 
        // Fallback nếu vì lý do nào đó recipientEmail cũ vẫn còn trong một số bản ghi
        // (Mặc dù theo model mới thì trường này không được sử dụng chính thức nữa)
        recipientDisplayEmail = share.recipientEmail;
      }

      return {
        _id: share._id,
        recipientEmail: recipientDisplayEmail,
        recipientName: recipientDisplayName, // Bạn có thể dùng trường này ở frontend nếu muốn
        createdAt: share.createdAt,
        sharedStocksCount: share.sharedStocks ? share.sharedStocks.length : 0,
        status: share.status
      };
    });

    res.json(myShares);
  } catch (error) {
    console.error('Lỗi khi lấy các lượt chia sẻ của tôi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lấy danh sách đã chia sẻ.' });
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
