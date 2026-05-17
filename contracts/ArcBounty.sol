// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcBounty
 * @notice USDC bounty escrow on Arc Network with two-way reputation reviews.
 * Native USDC (msg.value) — Arc Testnet native token.
 */
contract ArcBounty {
    error ZeroAmount();
    error EmptyField();
    error BountyNotFound();
    error NotOpen();
    error NotClosed();
    error NotClient();
    error NotParticipant();
    error ClientCannotSubmit();
    error AlreadySubmitted();
    error AlreadyReviewed();
    error MaxReached();
    error DeadlinePassed();
    error InvalidDeadline();
    error InvalidRating();
    error InvalidReviewee();
    error NoSubmissions();
    error SubmissionNotFound();
    error TransferFailed();

    enum Status { Open, Closed, Cancelled, Disputed }

    struct Submission {
        uint256 id;
        address contributor;
        string url;
        uint256 submittedAt;
        bool approved;
    }

    struct Bounty {
        uint256 id;
        address client;
        uint256 amount;
        string title;
        string description;
        string category;
        uint256 deadline;
        uint256 maxSubmissions;
        uint256 createdAt;
        uint256 closedAt;
        Status status;
    }

    struct Review {
        uint256 bountyId;
        address reviewer;
        address reviewee;
        uint8 rating;
        string comment;
        uint256 createdAt;
        bool fromClient;
    }

    struct UserStats {
        uint256 jobsCompleted;
        uint256 jobsPosted;
        uint256 totalEarned;
        uint256 totalPaid;
        uint256 ratingSum;
        uint256 ratingCount;
    }

    uint256 private _nextId;
    mapping(uint256 => Bounty) private _bounties;
    mapping(uint256 => Submission[]) private _submissions;
    mapping(uint256 => mapping(address => bool)) private _hasSubmitted;
    mapping(uint256 => address) private _winner;
    mapping(uint256 => mapping(address => bool)) private _hasReviewed;
    mapping(address => Review[]) private _reviewsReceived;
    mapping(address => UserStats) private _stats;
    address[] private _users;
    mapping(address => bool) private _knownUser;

    event BountyCreated(uint256 indexed id, address indexed client, uint256 amount, string title);
    event WorkSubmitted(uint256 indexed bountyId, uint256 submissionId, address indexed contributor);
    event WorkApproved(uint256 indexed bountyId, uint256 submissionId, address indexed winner, uint256 amount);
    event ReviewSubmitted(uint256 indexed bountyId, address indexed reviewer, address indexed reviewee, uint8 rating, bool fromClient);
    event BountyCancelled(uint256 indexed id, address indexed client, uint256 amount);
    event BountyDisputed(uint256 indexed id, address indexed reporter);

    function createBounty(
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 deadline,
        uint256 maxSubmissions
    ) external payable {
        if (msg.value == 0) revert ZeroAmount();
        if (bytes(title).length == 0) revert EmptyField();
        if (bytes(description).length == 0) revert EmptyField();
        if (deadline != 0 && deadline <= block.timestamp) revert InvalidDeadline();

        _touchUser(msg.sender);
        _stats[msg.sender].jobsPosted += 1;

        uint256 id = _nextId++;
        _bounties[id] = Bounty({
            id: id, client: msg.sender, amount: msg.value,
            title: title, description: description, category: category,
            deadline: deadline, maxSubmissions: maxSubmissions,
            createdAt: block.timestamp, closedAt: 0, status: Status.Open
        });
        emit BountyCreated(id, msg.sender, msg.value, title);
    }

    function submitWork(uint256 bountyId, string calldata url) external {
        Bounty storage b = _getBounty(bountyId);
        if (b.status != Status.Open) revert NotOpen();
        if (msg.sender == b.client) revert ClientCannotSubmit();
        if (bytes(url).length == 0) revert EmptyField();
        if (_hasSubmitted[bountyId][msg.sender]) revert AlreadySubmitted();
        if (b.deadline != 0 && block.timestamp > b.deadline) revert DeadlinePassed();
        if (b.maxSubmissions != 0 && _submissions[bountyId].length >= b.maxSubmissions) revert MaxReached();

        _touchUser(msg.sender);
        uint256 sid = _submissions[bountyId].length;
        _submissions[bountyId].push(Submission({ id: sid, contributor: msg.sender, url: url, submittedAt: block.timestamp, approved: false }));
        _hasSubmitted[bountyId][msg.sender] = true;
        emit WorkSubmitted(bountyId, sid, msg.sender);
    }

    function approveWork(uint256 bountyId, uint256 submissionId) external {
        Bounty storage b = _getBounty(bountyId);
        if (msg.sender != b.client) revert NotClient();
        if (b.status != Status.Open) revert NotOpen();
        if (_submissions[bountyId].length == 0) revert NoSubmissions();
        if (submissionId >= _submissions[bountyId].length) revert SubmissionNotFound();

        address winner = _submissions[bountyId][submissionId].contributor;
        uint256 amount = b.amount;

        _submissions[bountyId][submissionId].approved = true;
        _winner[bountyId] = winner;
        b.status = Status.Closed;
        b.closedAt = block.timestamp;

        _touchUser(winner);
        _stats[winner].jobsCompleted += 1;
        _stats[winner].totalEarned += amount;
        _stats[b.client].totalPaid += amount;

        (bool ok,) = winner.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit WorkApproved(bountyId, submissionId, winner, amount);
    }

    function submitReview(uint256 bountyId, address reviewee, uint8 rating, string calldata comment) external {
        Bounty storage b = _getBounty(bountyId);
        if (b.status != Status.Closed) revert NotClosed();
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (_hasReviewed[bountyId][msg.sender]) revert AlreadyReviewed();

        address winner = _winner[bountyId];
        bool fromClient = msg.sender == b.client && reviewee == winner;
        bool fromFreelancer = msg.sender == winner && reviewee == b.client;
        if (!fromClient && !fromFreelancer) revert InvalidReviewee();

        _touchUser(reviewee);
        _hasReviewed[bountyId][msg.sender] = true;
        _reviewsReceived[reviewee].push(Review({
            bountyId: bountyId,
            reviewer: msg.sender,
            reviewee: reviewee,
            rating: rating,
            comment: comment,
            createdAt: block.timestamp,
            fromClient: fromClient
        }));
        _stats[reviewee].ratingSum += rating;
        _stats[reviewee].ratingCount += 1;
        emit ReviewSubmitted(bountyId, msg.sender, reviewee, rating, fromClient);
    }

    function cancelBounty(uint256 bountyId) external {
        Bounty storage b = _getBounty(bountyId);
        if (msg.sender != b.client) revert NotClient();
        if (b.status != Status.Open) revert NotOpen();

        uint256 amount = b.amount;
        b.status = Status.Cancelled;
        (bool ok,) = b.client.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit BountyCancelled(bountyId, msg.sender, amount);
    }

    function markDisputed(uint256 bountyId) external {
        Bounty storage b = _getBounty(bountyId);
        if (b.status != Status.Open) revert NotOpen();
        if (_submissions[bountyId].length == 0) revert NoSubmissions();
        bool ok = msg.sender == b.client;
        if (!ok) {
            for (uint256 i = 0; i < _submissions[bountyId].length; i++) {
                if (_submissions[bountyId][i].contributor == msg.sender) { ok = true; break; }
            }
        }
        if (!ok) revert NotParticipant();
        b.status = Status.Disputed;
        emit BountyDisputed(bountyId, msg.sender);
    }

    function getBounty(uint256 id) external view returns (Bounty memory) { return _getBounty(id); }
    function getSubmissions(uint256 id) external view returns (Submission[] memory) { return _submissions[id]; }
    function hasSubmitted(uint256 id, address user) external view returns (bool) { return _hasSubmitted[id][user]; }
    function winnerOf(uint256 id) external view returns (address) { _getBounty(id); return _winner[id]; }
    function hasReviewed(uint256 bountyId, address user) external view returns (bool) { _getBounty(bountyId); return _hasReviewed[bountyId][user]; }
    function getReviewsReceived(address user) external view returns (Review[] memory) { return _reviewsReceived[user]; }
    function getUserStats(address user) external view returns (UserStats memory) { return _stats[user]; }
    function getUsers() external view returns (address[] memory) { return _users; }

    function getAllBounties() external view returns (Bounty[] memory) {
        Bounty[] memory list = new Bounty[](_nextId);
        for (uint256 i = 0; i < _nextId; i++) list[i] = _bounties[i];
        return list;
    }

    function getBountiesByClient(address client) external view returns (Bounty[] memory) {
        uint256 c = 0;
        for (uint256 i = 0; i < _nextId; i++) if (_bounties[i].client == client) c++;
        Bounty[] memory r = new Bounty[](c); uint256 idx = 0;
        for (uint256 i = 0; i < _nextId; i++) if (_bounties[i].client == client) r[idx++] = _bounties[i];
        return r;
    }

    function totalBounties() external view returns (uint256) { return _nextId; }

    function _getBounty(uint256 id) internal view returns (Bounty storage) {
        if (id >= _nextId) revert BountyNotFound();
        return _bounties[id];
    }

    function _touchUser(address user) internal {
        if (!_knownUser[user]) {
            _knownUser[user] = true;
            _users.push(user);
        }
    }
}
