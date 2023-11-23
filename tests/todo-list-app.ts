import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TodoListApp } from "../target/types/todo_list_app";
import { assert } from "chai";

describe("todo-list-app", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.TodoListApp as Program<TodoListApp>;
  const author = program.provider as anchor.AnchorProvider;
  it("can create a task", async () => {
    const task = anchor.web3.Keypair.generate();
    const tx = await program.methods
      .addingTask("You are awesome")
      .accounts({
        task: task.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task])
      .rpc();
    console.log("Your transaction signature", tx);

    const taskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount);

    assert.equal(
      taskAccount.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount.text, "You are awesome");
    assert.equal(taskAccount.isDone, false);
    assert.ok(taskAccount.createdAt);
    assert.ok(taskAccount.updatedAt);
  });

  // it("can create a new task from a different author", async () => {
  //   const user = anchor.web3.Keypair.generate();

  //   const signature = await program.provider.connection.requestAirdrop(
  //     user.publicKey,
  //     10000000000
  //   );

  //   const latestBlockHash =
  //     await program.provider.connection.getLatestBlockhash();

  //   await program.provider.connection.confirmTransaction({
  //     blockhash: latestBlockHash.blockhash,
  //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  //     signature,
  //   });

  //   const task = anchor.web3.Keypair.generate();

  //   const tx = await program.methods
  //     .addingTask("You are more than awesome")
  //     .accounts({
  //       task: task.publicKey,
  //       author: user.publicKey,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([task, user])
  //     .rpc();

  //   console.log("Your transaction signature", tx);
  //   const taskAccount = await program.account.task.fetch(task.publicKey);
  //   console.log("Your task", taskAccount);

  //   assert.equal(taskAccount.author.toBase58(), user.publicKey.toBase58());
  //   assert.equal(taskAccount.text, "You are more than awesome");
  //   assert.equal(taskAccount.isDone, false);
  //   assert.ok(taskAccount.createdAt);
  //   assert.ok(taskAccount.updatedAt);
  // });

  // it("can fetch all tasks", async () => {
  //   const tasks = await program.account.task.all();
  //   console.log("Your tasks", tasks);
  // });

  // it("can filter tasks by author", async () => {
  //   const authorPublicKey = author.wallet.publicKey;
  //   console.log("authorPublicKey", authorPublicKey.toBase58());
  //   const tasks = await program.account.task.all([
  //     {
  //       memcmp: {
  //         offset: 8,
  //         bytes: authorPublicKey.toBase58(),
  //       },
  //     },
  //   ]);

  //   assert.equal(tasks.length, 1);
  // });

  // it("can update a task to done", async () => {
  //   const task = anchor.web3.Keypair.generate();
  //   // create a new task
  //   // fetch it from the same address
  //   // then update
  //   const tx = await program.methods
  //     .updatingTask(true)
  //     .accounts({
  //       task: task.publicKey,
  //       author: author.wallet.publicKey,
  //     })
  //     .signers([author])
  //     .rpc();

  //   console.log("Your transaction signature", tx);

  //   const taskAccount = await program.account.task.fetch(task.publicKey);
  //   console.log("Your task", taskAccount);

  //   assert.equal(
  //     taskAccount.author.toBase58(),
  //     author.wallet.publicKey.toBase58()
  //   );
  //   assert.equal(taskAccount.isDone, true);
  // });

  it("cannot create a task with more than 400 characters", async () => {
    const task = anchor.web3.Keypair.generate();
    try {
      // Adjust the string length as needed
      const longString = "You are awesome".repeat(25); // Adjust to find the right length
      await program.methods
        .addingTask(longString)
        .accounts({
          task: task.publicKey,
          author: author.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([task])
        .rpc();
      assert.fail("Expected a TextTooLong error");
    } catch (err) {
      // Check for specific smart contract error
      assert.include(err.toString(), "TextTooLong");
    }
});

});
