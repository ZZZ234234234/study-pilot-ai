"""Original educational text authored for this project. Licensed under MIT.

The same source generates the sample PDF and explicitly labeled demo knowledge.
Nothing here is presented as a live model response.
"""

CHAPTERS = [
    (
        "01 / The learning problem",
        [
            (
                "Learning from examples",
                "A neural network learns a mapping from inputs to outputs by adjusting numerical parameters. Training examples provide evidence about this mapping. The network does not store a human explanation of each example; it uses shared parameters to make predictions across many examples. A useful model must work on new data, not merely repeat its training answers.",
                "high",
                "low",
                ["parameters", "prediction", "generalization"],
            ),
            (
                "Inputs, targets, and features",
                "A feature is a measurable property of an input, such as a pixel intensity or the length of a sentence. In supervised learning, a target is the desired output associated with an example. Data preparation should preserve information available at prediction time and avoid including the answer among the features. This mistake is called target leakage.",
                "high",
                "low",
                ["features", "targets", "leakage"],
            ),
        ],
    ),
    (
        "02 / Inside a neuron",
        [
            (
                "Weights and biases",
                "A neuron computes a weighted sum of its inputs and adds a bias. In the expression z = w1*x1 + w2*x2 + b, each weight controls the contribution of one input, while the bias shifts the result. A layer applies many such calculations in parallel. The weights and biases are learned parameters rather than values chosen separately for every prediction.",
                "high",
                "medium",
                ["weights", "bias", "layer"],
            ),
            (
                "Why activation functions matter",
                "An activation function introduces nonlinearity after the weighted sum. Without nonlinear activations, stacking linear layers is still equivalent to a single linear transformation. ReLU returns zero for negative inputs and returns the input otherwise. Sigmoid maps a real value into the interval between zero and one. The choice of activation depends on the layer and the task.",
                "high",
                "medium",
                ["activation", "ReLU", "nonlinearity"],
            ),
        ],
    ),
    (
        "03 / Training the network",
        [
            (
                "Loss and gradient descent",
                "A loss function measures the difference between predictions and targets. Gradient descent updates parameters in the direction that reduces the loss locally. The learning rate controls the size of each update. A very large rate may cause unstable training; a very small rate may make progress slow. Lower training loss alone does not prove better performance on unseen data.",
                "high",
                "medium",
                ["loss", "gradient", "learning rate"],
            ),
            (
                "Backpropagation",
                "Backpropagation applies the chain rule to compute how each parameter affects the loss. A forward pass produces predictions, and a backward pass propagates derivatives through the network. An optimizer then uses these derivatives to update the parameters. Backpropagation computes gradients; the optimizer decides how to use them. These are related but distinct operations.",
                "high",
                "high",
                ["chain rule", "backpropagation", "optimizer"],
            ),
        ],
    ),
    (
        "04 / Seeing with convolution",
        [
            (
                "Why convolution is useful",
                "Convolution uses a small filter repeatedly across an image. Local connectivity captures nearby patterns, and weight sharing lets the same feature detector operate at different positions. This reduces the number of learned parameters compared with a fully connected layer on a large image. Early filters can detect simple edges; later layers can combine local features into more complex patterns.",
                "high",
                "medium",
                ["convolution", "locality", "weight sharing"],
            ),
            (
                "Stride, padding, and pooling",
                "Stride determines how far a filter moves between applications. Padding adds values around the image boundary to control spatial size and preserve edge coverage. Pooling summarizes a small neighborhood, for example by taking its maximum value. Downsampling reduces spatial detail, so it should be used with care when precise positions matter, such as in image segmentation.",
                "medium",
                "medium",
                ["stride", "padding", "pooling"],
            ),
        ],
    ),
    (
        "05 / Learning without memorizing",
        [
            (
                "Overfitting and generalization",
                "Overfitting occurs when a model fits details specific to the training set that do not transfer to new examples. One warning sign is falling training loss accompanied by rising validation loss. Generalization is the ability to perform well on unseen data drawn from the relevant task distribution. More model capacity is not always better when data are limited or noisy.",
                "high",
                "medium",
                ["overfitting", "validation", "generalization"],
            ),
            (
                "Regularization and early stopping",
                "Regularization discourages overly complex solutions. Weight decay penalizes large weights, while dropout randomly removes some activations during training. Early stopping selects a training checkpoint using validation performance. It must not repeatedly inspect the final test set. These methods can reduce overfitting, but none can repair a fundamentally unrepresentative dataset.",
                "medium",
                "medium",
                ["weight decay", "dropout", "early stopping"],
            ),
        ],
    ),
    (
        "06 / Measuring what matters",
        [
            (
                "Train, validation, and test",
                "The training set is used to fit parameters. The validation set guides model selection and hyperparameter choices. The test set is reserved for a final estimate of performance. If multiple samples belong to the same person, related samples should remain in the same split. Otherwise, information from a person may leak across splits and inflate the reported result.",
                "high",
                "medium",
                ["train", "validation", "test"],
            ),
            (
                "Accuracy is not enough",
                "Accuracy is the fraction of predictions that are correct. On an imbalanced dataset, a model can achieve high accuracy by predicting the majority class. Precision asks how many predicted positives are truly positive. Recall asks how many actual positives are found. Choosing a metric should reflect the costs of different mistakes and the intended use of the system.",
                "high",
                "medium",
                ["accuracy", "precision", "recall"],
            ),
        ],
    ),
    (
        "07 / A practical workflow",
        [
            (
                "Build a trustworthy baseline",
                "Start with a simple baseline and a clear evaluation protocol. Check a small batch of inputs and labels manually. Verify shapes, units, missing values, and preprocessing. Try overfitting a tiny training subset to detect basic implementation errors. Change one important factor at a time and keep experiment notes so that improvements can be attributed to specific decisions.",
                "medium",
                "low",
                ["baseline", "debugging", "experiments"],
            ),
            (
                "Reproducibility and limitations",
                "Record the data split, preprocessing steps, model configuration, software versions, and random seed. Reproducibility does not guarantee that a conclusion is correct, but it makes verification easier. Report limitations such as small sample size, distribution shift, or uncertain labels. A reliable report separates observed results from hypotheses about why they occurred.",
                "medium",
                "low",
                ["reproducibility", "seed", "limitations"],
            ),
        ],
    ),
    (
        "08 / A better way to review",
        [
            (
                "Active recall",
                "Active recall means trying to retrieve an idea before looking at the answer. Explain why nonlinear activations are needed, compare validation and test sets, or sketch a convolution filter moving across an image. A correct-looking answer is not enough: compare your explanation with the source and identify exactly which link in your reasoning was missing.",
                "medium",
                "low",
                ["retrieval", "explanation", "review"],
            ),
            (
                "Spaced practice",
                "Spaced practice revisits material across multiple sessions rather than in one long sitting. Review difficult ideas sooner and extend the interval after successful recall. A useful review card asks one focused question and includes a source reference. A schedule is a guide, not a guarantee of memory; adjust it according to your performance and available time.",
                "medium",
                "low",
                ["spacing", "flashcards", "memory"],
            ),
        ],
    ),
]
