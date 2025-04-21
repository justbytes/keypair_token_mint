import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { KeypairTokenMint } from '../target/types/keypair_token_mint';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
} from '@solana/spl-token';
import { Keypair } from '@solana/web3.js';
import { assert } from 'chai';

describe('token-example', () => {
  // Set up the provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.KeypairTokenMint as Program<KeypairTokenMint>;

  // Generate a keypair for the mint
  const mintKeypair = Keypair.generate();

  it('Creates a mint', async () => {
    const tx = await program.methods
      .createMint()
      .accounts({
        signer: provider.wallet.publicKey,
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mintKeypair]) // Include the mint keypair as a signer
      .rpc({ commitment: 'confirmed' });

    console.log('Your transaction signature', tx);

    const mintAccount = await getMint(
      provider.connection,
      mintKeypair.publicKey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    console.log('Mint Account', mintAccount);
  });

  it('Creates a token account', async () => {
    // Get the associated token account address
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
      .createTokenAccount()
      .accounts({
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc({ commitment: 'confirmed' });

    console.log('Your transaction signature', tx);

    const tokenAccount = await getAccount(
      provider.connection,
      associatedTokenAccount,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    console.log('Token Account', tokenAccount);
  });

  it('Mints tokens to the token account', async () => {
    // Get the associated token account address
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Amount to mint (in the smallest unit)
    const amountToMint = 1000000000; // 1000 tokens with 6 decimals

    const tx = await program.methods
      .mintTokens(new anchor.BN(amountToMint))
      .accounts({
        signer: provider.wallet.publicKey,
        mint: mintKeypair.publicKey,
        tokenAccount: associatedTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc({ commitment: 'confirmed' });

    console.log('Mint transaction signature', tx);

    // Fetch the updated token account
    const tokenAccount = await getAccount(
      provider.connection,
      associatedTokenAccount,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    console.log('Token Account after mint', tokenAccount);

    // Assert that the token account has the correct balance
    assert.equal(
      tokenAccount.amount.toString(),
      amountToMint.toString(),
      'Token account has incorrect balance after minting'
    );
  });
});
