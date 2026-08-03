# Task 3 · LoRA News-Topic Fine-Tuning

Build a finance/sports/gaming news-topic classifier LoRA on MiniMind-3. Course prompts vary in wording, category order, and option layout so that a model cannot merely adapt to one fixed prompt.

## Controlled materials

This public student package does not contain training data, validation data, starter scripts, reference answers, the final test set, or model weights. Obtain the teacher-provided training/validation materials only from the course-access-controlled location.

The final test set remains instructor-only until your configuration is locked. Never upload TNEWS raw data, course data, LoRA weights, or reference answers to a public repository.

## Recommended workflow

1. Check data splits, class counts, and sample-ID isolation.
2. Train only on the training split and select a checkpoint using validation data.
3. Lock epochs, learning rate, LoRA rank, maximum length, and prompt design.
4. Run the instructor-provided final test once.
5. Preserve at least ten prediction examples, including both correct and incorrect outputs.

Your report must state training size, class counts, LoRA configuration, best validation result, final-test result, and definitions of strict and normalized accuracy.
