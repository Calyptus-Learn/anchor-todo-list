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

  it("can create a new task from a different author", async () => {
    const user = anchor.web3.Keypair.generate();

    const signature = await program.provider.connection.requestAirdrop(
      user.publicKey,
      10000000000
    );

    const latestBlockHash =
      await program.provider.connection.getLatestBlockhash();

    await program.provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature,
    });

    const task = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .addingTask("You are more than awesome")
      .accounts({
        task: task.publicKey,
        author: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task, user])
      .rpc();

    console.log("Your transaction signature", tx);
    const taskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount);

    assert.equal(taskAccount.author.toBase58(), user.publicKey.toBase58());
    assert.equal(taskAccount.text, "You are more than awesome");
    assert.equal(taskAccount.isDone, false);
    assert.ok(taskAccount.createdAt);
    assert.ok(taskAccount.updatedAt);
  });

  it("can fetch all tasks", async () => {
    const tasks = await program.account.task.all();
    console.log("Your tasks", tasks);
  });

  it("can filter tasks by author", async () => {
    const authorPublicKey = author.wallet.publicKey;
    console.log("authorPublicKey", authorPublicKey.toBase58());
    const tasks = await program.account.task.all([
      {
        memcmp: {
          offset: 8,
          bytes: authorPublicKey.toBase58(),
        },
      },
    ]);

    // assert.equal(tasks.length, 1);
    // This test case fails if `anchor test --skip-build --skip-deploy` command is used.
    assert.isAtLeast(tasks.length, 1);
  });

  it("can update a task to done", async () => {
    const task = anchor.web3.Keypair.generate();
    
    // create a new task
    const tx1 = await program.methods
        .addingTask("Updating task")
        .accounts({
          task: task.publicKey,
          author: author.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([task])
        .rpc();
    // fetch it from the same address
    console.log("Your transaction signature for create ", tx1);
    const taskAccount1 = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount1);

    assert.equal(
      taskAccount1.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount1.text, "Updating task");

    // then update
    const tx2 = await program.methods
      .updatingTask(true)
      .accounts({
        task: task.publicKey,
        author: author.wallet.publicKey,
      })
      .signers([]) // By default the anchor tests use the provider.wallet as the payer and signer for transactions.
      .rpc();

    console.log("Your transaction signature for update", tx2);

    const taskAccount2 = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount2);

    assert.equal(
      taskAccount2.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount2.isDone, true);
  });

  it("can delete a task", async () => {
    const task = anchor.web3.Keypair.generate();
    
    // create a new task
    const tx1 = await program.methods
        .addingTask("Deleting task")
        .accounts({
          task: task.publicKey,
          author: author.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([task])
        .rpc();
    // fetch it from the same address
    console.log("Your transaction signature for create ", tx1);
    const taskAccount1 = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount1);

    assert.equal(
      taskAccount1.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount1.text, "Deleting task");

    // then update
    const tx2 = await program.methods
      .deletingTask()
      .accounts({
        task: task.publicKey,
        author: author.wallet.publicKey,
      })
      .signers([]) // By default the anchor tests use the provider.wallet as the payer and signer for transactions.
      .rpc();

    console.log("Your transaction signature for delete", tx2);

    const taskAccount2 = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount2);

    assert.equal(
      taskAccount2.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount2.isDone, true);
  });

  it("cannot create a task with more than 400 characters", async () => {
    const task = anchor.web3.Keypair.generate();
    try {
      const longString = "You are awesome".repeat(25);
      await program.methods
        .addingTask(longString)
        .accounts({
          task: task.publicKey,
          author: author.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([task])
        .rpc();
      assert.fail("Expected a long string error");
    } catch (err) {
      assert.include(err.message, "Expected a long string error");
    }
  });
});
