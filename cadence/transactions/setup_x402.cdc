import "EVM"
import "FungibleToken"
import "FlowToken"

/// One-shot setup: creates COA, funds it with FLOW, and approves Permit2
/// for stgUSDC spending. After this, the COA is ready for x402 payments.
///
/// Parameters:
///   - flowAmount: FLOW to deposit into COA for gas
///   - approveAmount: stgUSDC amount to approve for Permit2 (use max uint256 for unlimited)
///
transaction(flowAmount: UFix64, approveAmount: UInt256) {
    let coa: auth(EVM.Call) &EVM.CadenceOwnedAccount

    prepare(signer: auth(SaveValue, BorrowValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        let storagePath = /storage/evm
        let publicPath = /public/evm

        // 1. Create COA if needed
        if signer.storage.type(at: storagePath) == nil {
            let newCoa <- EVM.createCadenceOwnedAccount()
            signer.storage.save(<-newCoa, to: storagePath)

            let cap = signer.capabilities.storage.issue<&EVM.CadenceOwnedAccount>(storagePath)
            signer.capabilities.publish(cap, at: publicPath)
        }

        self.coa = signer.storage.borrow<auth(EVM.Call) &EVM.CadenceOwnedAccount>(
            from: storagePath
        ) ?? panic("Could not borrow COA")

        // 2. Fund COA with FLOW
        if flowAmount > 0.0 {
            let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")

            let sentVault <- vaultRef.withdraw(amount: flowAmount) as! @FlowToken.Vault
            self.coa.deposit(from: <-sentVault)
        }
    }

    execute {
        // 3. Approve Permit2 for stgUSDC
        if approveAmount > 0 {
            let stgUSDC = "0xF1815bd50389c46847f0Bda824eC8da914045D14"
            let permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3"

            let calldata: [UInt8] = EVM.encodeABIWithSignature(
                "approve(address,uint256)",
                [EVM.addressFromString(permit2), approveAmount]
            )

            let result = self.coa.call(
                to: EVM.addressFromString(stgUSDC),
                data: calldata,
                gasLimit: 100_000,
                value: EVM.Balance(attoflow: 0 as UInt)
            )

            assert(
                result.status == EVM.Status.successful,
                message: "approve() failed: \(result.errorMessage)"
            )
        }
    }
}
