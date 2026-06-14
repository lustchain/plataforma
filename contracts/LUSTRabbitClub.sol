// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts@4.9.6/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.9.6/token/common/ERC2981.sol";
import "@openzeppelin/contracts@4.9.6/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts@4.9.6/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts@4.9.6/access/Ownable.sol";
import "@openzeppelin/contracts@4.9.6/security/Pausable.sol";
import "@openzeppelin/contracts@4.9.6/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts@4.9.6/utils/Strings.sol";

/// @title LUST Rabbit Club
/// @notice Official premium founder NFT collection of LUST Chain.
/// @dev ERC721 + ERC2981 royalties + ERC20 paid mint. Designed for LUSDT on LUST Chain.
contract LUSTRabbitClub is ERC721, ERC2981, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    uint256 public maxReservedMint = 300;
    uint256 public reservedMinted;

    IERC20 public paymentToken;

    // LUSDT has 6 decimals.
    uint256 public whitelistPrice = 50_000_000;  // 50 LUSDT
    uint256 public publicPrice = 100_000_000;    // 100 LUSDT

    uint256 public totalMinted;

    uint256 public maxWhitelistMintPerWallet = 3;
    uint256 public maxPublicMintPerWallet = 10;
    uint256 public maxMintPerTx = 5;

    bool public whitelistSaleOpen;
    bool public publicSaleOpen;
    bool public revealed;

    string private baseMetadataURI;
    string public hiddenMetadataURI;
    string public baseExtension = ".json";

    address public treasuryWallet;
    address public liquidityWallet;

    uint16 public treasuryBps = 8000;
    uint16 public liquidityBps = 2000;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public whitelistMinted;
    mapping(address => uint256) public publicMinted;

    string public collectionLicense =
        "Holder may commercially use the specific LUST Rabbit NFT owned by their wallet, but cannot claim ownership of the official LUST Chain brand, logo or trademarks.";

    event WhitelistSaleUpdated(bool open);
    event PublicSaleUpdated(bool open);
    event RevealedUpdated(bool revealed);
    event WhitelistUpdated(address indexed account, bool allowed);
    event WhitelistBatchUpdated(uint256 totalAccounts, bool allowed);
    event RabbitMinted(address indexed buyer, uint256 indexed tokenId, uint256 pricePaid, bool whitelistMint);
    event ReserveMinted(address indexed to, uint256 quantity);
    event PaymentTokenUpdated(address oldToken, address newToken);
    event WhitelistPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PublicPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BaseMetadataURIUpdated(string oldURI, string newURI);
    event HiddenMetadataURIUpdated(string oldURI, string newURI);
    event BaseExtensionUpdated(string oldExtension, string newExtension);
    event TreasuryWalletUpdated(address oldWallet, address newWallet);
    event LiquidityWalletUpdated(address oldWallet, address newWallet);
    event SplitUpdated(uint16 treasuryBps, uint16 liquidityBps);
    event CollectionLicenseUpdated(string oldLicense, string newLicense);

    constructor(
        address _paymentToken,
        address _treasuryWallet,
        address _liquidityWallet,
        string memory _hiddenMetadataURI,
        address _royaltyReceiver,
        uint96 _royaltyFeeNumerator
    ) ERC721("LUST Rabbit Club", "LRC") {
        require(_paymentToken != address(0), "Invalid payment token");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_liquidityWallet != address(0), "Invalid liquidity wallet");
        require(bytes(_hiddenMetadataURI).length > 0, "Empty hidden URI");
        require(_royaltyReceiver != address(0), "Invalid royalty receiver");

        paymentToken = IERC20(_paymentToken);
        treasuryWallet = _treasuryWallet;
        liquidityWallet = _liquidityWallet;
        hiddenMetadataURI = _hiddenMetadataURI;

        _setDefaultRoyalty(_royaltyReceiver, _royaltyFeeNumerator);
    }

    function whitelistMint(uint256 quantity) external nonReentrant whenNotPaused {
        require(whitelistSaleOpen, "Whitelist sale closed");
        require(whitelist[msg.sender], "Not whitelisted");
        require(quantity > 0, "Quantity zero");
        require(quantity <= maxMintPerTx, "Exceeds max per tx");
        require(whitelistMinted[msg.sender] + quantity <= maxWhitelistMintPerWallet, "Exceeds whitelist wallet limit");
        require(totalMinted + quantity <= MAX_SUPPLY, "Sold out");

        whitelistMinted[msg.sender] += quantity;
        _collectPayment(msg.sender, whitelistPrice * quantity);
        _mintRabbits(msg.sender, quantity, whitelistPrice, true);
    }

    function publicMint(uint256 quantity) external nonReentrant whenNotPaused {
        require(publicSaleOpen, "Public sale closed");
        require(quantity > 0, "Quantity zero");
        require(quantity <= maxMintPerTx, "Exceeds max per tx");
        require(publicMinted[msg.sender] + quantity <= maxPublicMintPerWallet, "Exceeds public wallet limit");
        require(totalMinted + quantity <= MAX_SUPPLY, "Sold out");

        publicMinted[msg.sender] += quantity;
        _collectPayment(msg.sender, publicPrice * quantity);
        _mintRabbits(msg.sender, quantity, publicPrice, false);
    }

    function reserveMint(address to, uint256 quantity) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid receiver");
        require(quantity > 0, "Quantity zero");
        require(reservedMinted + quantity <= maxReservedMint, "Exceeds reserve");
        require(totalMinted + quantity <= MAX_SUPPLY, "Sold out");

        reservedMinted += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            totalMinted += 1;
            _safeMint(to, totalMinted);
        }

        emit ReserveMinted(to, quantity);
    }

    function _collectPayment(address buyer, uint256 amount) internal {
        require(amount > 0, "Invalid payment amount");

        uint256 treasuryAmount = (amount * treasuryBps) / BPS_DENOMINATOR;
        uint256 liquidityAmount = amount - treasuryAmount;

        if (treasuryAmount > 0) paymentToken.safeTransferFrom(buyer, treasuryWallet, treasuryAmount);
        if (liquidityAmount > 0) paymentToken.safeTransferFrom(buyer, liquidityWallet, liquidityAmount);
    }

    function _mintRabbits(address to, uint256 quantity, uint256 unitPrice, bool whitelistMintType) internal {
        for (uint256 i = 0; i < quantity; i++) {
            totalMinted += 1;
            uint256 tokenId = totalMinted;
            _safeMint(to, tokenId);
            emit RabbitMinted(to, tokenId, unitPrice, whitelistMintType);
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        if (!revealed) return hiddenMetadataURI;

        return string(abi.encodePacked(baseMetadataURI, tokenId.toString(), baseExtension));
    }

    function setWhitelistSaleOpen(bool open) external onlyOwner {
        whitelistSaleOpen = open;
        emit WhitelistSaleUpdated(open);
    }

    function setPublicSaleOpen(bool open) external onlyOwner {
        publicSaleOpen = open;
        emit PublicSaleUpdated(open);
    }

    function setRevealed(bool value) external onlyOwner {
        revealed = value;
        emit RevealedUpdated(value);
    }

    function setWhitelist(address account, bool allowed) external onlyOwner {
        require(account != address(0), "Invalid account");
        whitelist[account] = allowed;
        emit WhitelistUpdated(account, allowed);
    }

    function setWhitelistBatch(address[] calldata accounts, bool allowed) external onlyOwner {
        require(accounts.length > 0, "Empty accounts");
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "Invalid account");
            whitelist[accounts[i]] = allowed;
            emit WhitelistUpdated(accounts[i], allowed);
        }
        emit WhitelistBatchUpdated(accounts.length, allowed);
    }

    function setPaymentToken(address newPaymentToken) external onlyOwner {
        require(newPaymentToken != address(0), "Invalid payment token");
        address oldToken = address(paymentToken);
        paymentToken = IERC20(newPaymentToken);
        emit PaymentTokenUpdated(oldToken, newPaymentToken);
    }

    function setWhitelistPrice(uint256 newWhitelistPrice) external onlyOwner {
        require(newWhitelistPrice > 0, "Invalid price");
        uint256 oldPrice = whitelistPrice;
        whitelistPrice = newWhitelistPrice;
        emit WhitelistPriceUpdated(oldPrice, newWhitelistPrice);
    }

    function setPublicPrice(uint256 newPublicPrice) external onlyOwner {
        require(newPublicPrice > 0, "Invalid price");
        uint256 oldPrice = publicPrice;
        publicPrice = newPublicPrice;
        emit PublicPriceUpdated(oldPrice, newPublicPrice);
    }

    function setMaxWhitelistMintPerWallet(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Invalid limit");
        maxWhitelistMintPerWallet = newLimit;
    }

    function setMaxPublicMintPerWallet(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Invalid limit");
        maxPublicMintPerWallet = newLimit;
    }

    function setMaxMintPerTx(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Invalid limit");
        maxMintPerTx = newLimit;
    }

    function setBaseMetadataURI(string calldata newBaseMetadataURI) external onlyOwner {
        require(bytes(newBaseMetadataURI).length > 0, "Empty base URI");
        string memory oldURI = baseMetadataURI;
        baseMetadataURI = newBaseMetadataURI;
        emit BaseMetadataURIUpdated(oldURI, newBaseMetadataURI);
    }

    function setHiddenMetadataURI(string calldata newHiddenMetadataURI) external onlyOwner {
        require(bytes(newHiddenMetadataURI).length > 0, "Empty hidden URI");
        string memory oldURI = hiddenMetadataURI;
        hiddenMetadataURI = newHiddenMetadataURI;
        emit HiddenMetadataURIUpdated(oldURI, newHiddenMetadataURI);
    }

    function setBaseExtension(string calldata newBaseExtension) external onlyOwner {
        string memory oldExtension = baseExtension;
        baseExtension = newBaseExtension;
        emit BaseExtensionUpdated(oldExtension, newBaseExtension);
    }

    function setTreasuryWallet(address newTreasuryWallet) external onlyOwner {
        require(newTreasuryWallet != address(0), "Invalid treasury wallet");
        address oldWallet = treasuryWallet;
        treasuryWallet = newTreasuryWallet;
        emit TreasuryWalletUpdated(oldWallet, newTreasuryWallet);
    }

    function setLiquidityWallet(address newLiquidityWallet) external onlyOwner {
        require(newLiquidityWallet != address(0), "Invalid liquidity wallet");
        address oldWallet = liquidityWallet;
        liquidityWallet = newLiquidityWallet;
        emit LiquidityWalletUpdated(oldWallet, newLiquidityWallet);
    }

    function setSplit(uint16 newTreasuryBps, uint16 newLiquidityBps) external onlyOwner {
        require(uint256(newTreasuryBps) + uint256(newLiquidityBps) == BPS_DENOMINATOR, "Invalid split");
        treasuryBps = newTreasuryBps;
        liquidityBps = newLiquidityBps;
        emit SplitUpdated(newTreasuryBps, newLiquidityBps);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        require(receiver != address(0), "Invalid royalty receiver");
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

    function setCollectionLicense(string calldata newLicense) external onlyOwner {
        require(bytes(newLicense).length > 0, "Empty license");
        string memory oldLicense = collectionLicense;
        collectionLicense = newLicense;
        emit CollectionLicenseUpdated(oldLicense, newLicense);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
