// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'erc721a/contracts/ERC721A.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

error Movebirds__TransferFailed();
error Movebirds__SoldOut();
error Movebirds__OutOfMaxPerWallet();
error Movebirds__PublicMintStopped();
error Movebirds__AllowlistMintStopped();
error Movebirds__InvalidSigner();
error Movebirds__WaitlistMintStopped();
error Movebirds__IncorrectValue();
error Movebirds__StageNotStartedYet(uint256 stage);

contract Movebirds is ERC721A, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    enum SaleStage {
        Stop, // 0
        Allowlist, // 1
        Waitlist, // 2
        Public, // 3
        SoldOut // 4
    }

    uint256 public maxSupply = 10;
    uint256 public maxPerAddress = 2;
    uint256 public tokenPrice = 0.005 ether;

    address private signerAddressAllowlist;
    address private signerAddressWaitlist;

    SaleStage public saleStage = SaleStage.Stop;
    string private baseTokenUri;

    modifier mintCompliance(uint256 quantity) {
        if (totalSupply() + quantity > maxSupply) {
            revert Movebirds__SoldOut();
        }
        if (numberMinted(msg.sender) + quantity > maxPerAddress) {
            revert Movebirds__OutOfMaxPerWallet();
        }
        if (
            (quantity > 1 || numberMinted(msg.sender) > 0) &&
            (quantity * tokenPrice != msg.value)
        ) {
            revert Movebirds__IncorrectValue();
        }

        _;
    }

    constructor(string memory defaultBaseUri)
        ERC721A('Movebirds', 'MB')
    {
        baseTokenUri = defaultBaseUri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenUri;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721A)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function mintPublic(uint256 quantity)
        external
        payable
        mintCompliance(quantity)
    {
        if (SaleStage.Public != saleStage) {
            revert Movebirds__StageNotStartedYet(uint256(saleStage));
        }
        internalMint(quantity);
    }

    function mintAllowlist(uint256 quantity, bytes memory signature)
        external
        payable
        mintCompliance(quantity)
    {
        if (SaleStage.Allowlist != saleStage) {
            revert Movebirds__StageNotStartedYet(uint256(saleStage));
        }
        if (
            !_verify(
                signerAddressAllowlist,
                keccak256(abi.encodePacked(msg.sender)),
                signature
            )
        ) {
            revert Movebirds__InvalidSigner();
        }
        internalMint(quantity);
    }

    function mintWaitlist(uint256 quantity, bytes memory signature)
        external
        payable
        mintCompliance(quantity)
    {
        if (SaleStage.Waitlist != saleStage) {
            revert Movebirds__StageNotStartedYet(uint256(saleStage));
        }
        if (
            !_verify(
                signerAddressWaitlist,
                keccak256(abi.encodePacked(msg.sender)),
                signature
            )
        ) {
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
        _safeMint(msg.sender, quantity);
    }

    function withdrawTo(address to) external onlyOwner {
        (bool success, ) = to.call{value: address(this).balance}('');
        if (!success) {
            revert Movebirds__TransferFailed();
        }
    }

    function _verify(
        address signer,
        bytes32 _hash,
        bytes memory signature
    ) internal pure returns (bool) {
        return _hash.toEthSignedMessageHash().recover(signature) == signer;
    }

    function setSaleStage(uint256 newStage) external onlyOwner {
        saleStage = SaleStage(newStage);
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

    function numberMinted(address claimer) public view returns (uint256) {
        return _numberMinted(claimer);
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        maxSupply = newMaxSupply;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        tokenPrice = newPrice;
    }
}
