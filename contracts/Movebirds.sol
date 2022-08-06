// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import 'erc721a/contracts/ERC721A.sol';
import '@openzeppelin/contracts/token/common/ERC2981.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

error Movebirds__TransferFailed();
error Movebirds__SoldOut();
error Movebirds__OutOfMaxPerWallet();
error Movebirds__PublicMintStopped();
error Movebirds__AllowlistMintStopped();
error Movebirds__InvalidSigner();
error Movebirds__WaitlistMintStopped();
error Movebirds__StageNotStartedYet(uint256 stage);

contract PeepeeSoss is ERC721A, ERC2981, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    enum SaleStage {
        Stop,
        Allowlist,
        Waitlist,
        Public,
        SoldOut
    }

    uint256 public maxSupply = 10;
    uint256 public maxPerAddress = 1;

    address private signerAddressAllowlist;
    address private signerAddressWaitlist;

    SaleStage public s_saleStage = SaleStage.Stop;
    string private s_baseTokenUri;

    mapping(address => uint256) private s_tokensClaimed;

    modifier mintCompliance(uint256 quantity) {
        if (totalSupply() + quantity > maxSupply) {
            revert Movebirds__SoldOut();
        }
        if (s_tokensClaimed[msg.sender] + quantity > maxPerAddress) {
            revert Movebirds__OutOfMaxPerWallet();
        }

        _;
    }

    constructor(string memory defaultBaseUri, address royaltyReciver)
        ERC721A('PeepeeSoss', 'PS')
    {
        _setDefaultRoyalty(royaltyReciver, 500);
        s_baseTokenUri = defaultBaseUri;
    }

    function _baseURI() internal view override returns (string memory) {
        return s_baseTokenUri;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721A, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function mintPublic(uint256 quantity) external mintCompliance(quantity) {
        if (SaleStage.Public != s_saleStage) {
            revert Movebirds__StageNotStartedYet(uint256(s_saleStage));
        }
        internalMint(quantity);
    }

    function mintAllowlist(
        uint256 quantity,
        bytes32 _hash,
        bytes memory signature
    ) external mintCompliance(quantity) {
        if (SaleStage.Allowlist != s_saleStage) {
            revert Movebirds__StageNotStartedYet(uint256(s_saleStage));
        }
        if (!_verify(signerAddressAllowlist, _hash, signature)) {
            revert Movebirds__InvalidSigner();
        }
        internalMint(quantity);
    }

    function mintWaitlist(
        uint256 quantity,
        bytes32 _hash,
        bytes memory signature
    ) external mintCompliance(quantity) {
        if (SaleStage.Waitlist != s_saleStage) {
            revert Movebirds__StageNotStartedYet(uint256(s_saleStage));
        }
        if (!_verify(signerAddressWaitlist, _hash, signature)) {
            revert Movebirds__InvalidSigner();
        }
        internalMint(quantity);
    }

    function mintDev(uint256 quantity) external onlyOwner {
        if (maxSupply <= totalSupply() + quantity) {
            revert Movebirds__SoldOut();
        }
        _safeMint(msg.sender, quantity);
    }

    function internalMint(uint256 quantity) internal {
        s_tokensClaimed[msg.sender] += quantity;
        _safeMint(msg.sender, quantity);
    }

    function _verify(
        address signer,
        bytes32 _hash,
        bytes memory signature
    ) internal pure returns (bool) {
        return
            ECDSA.recover(ECDSA.toEthSignedMessageHash(_hash), signature) ==
            signer;
    }

    function setSaleStage(uint256 newStage) external onlyOwner {
        s_saleStage = SaleStage(newStage);
    }

    function setMaxPerAddress(uint256 newMax) external onlyOwner {
        maxPerAddress = newMax;
    }

    function setAllowlistSigner(address signer) external onlyOwner {
        signerAddressAllowlist = signer;
    }

    function setWaitlistSigner(address signer) external onlyOwner {
        signerAddressWaitlist = signer;
    }

    function getTokensCaimed(address claimer) external view returns (uint256) {
        return s_tokensClaimed[claimer];
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyOwner
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }
}
