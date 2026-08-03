# Task 1 · Base MiniMind-3 Deployment

Run the official Transformers-format MiniMind-3 without the course news LoRA.

```powershell
conda activate minimind
cd D:\AI\CodeX\MiniLLM\minimind
python eval_llm.py --load_from .\minimind-3 --device cuda:0 --open_thinking 0 --max_new_tokens 256
```

Enter `1` after startup to use manual input. If no GPU is available, change `cuda:0` to `cpu`; generation will be much slower.

Suggested prompts:

1. `Please explain artificial intelligence in one sentence.`
2. `What is the capital of China?`
3. `Choose exactly one news topic: finance, sports, or gaming. Output only the topic name. Headline: “League of Legends: overseas viewers discuss and criticize RNG.”`

Keep the raw outputs. The goal is to compare open-ended answering with strict-format following, not to make every answer correct.
