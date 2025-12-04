---
author: Baptiste Marlet
pubDatetime: 2025-12-04T21:26:00Z
title: When LLM make you lose time
postSlug: when-llm-make-you-lose-time
featured: true
draft: false
tags:
  - tech
  - rant
  - ai
ogImage: ""
description: A rant about how the usage of LLM impacts me in my work.
---

## Table of contents

## Introduction

LLM have been more and more present recently in development. We have all used them, they help us win
time when we need to write boring code, they help to write documentation, they generate HTML and CSS
far better than I can, they help to debug by suggesting potential issues with the code… But at they
same time, they are not perfect in any way. Without even talking about generative AI that are used
to generate art, or write essays, I want to rant here about the time it's making me lose at work.

## PR reviewing

It all starts when I was reviewing a PR. An issue that we had in production, the fix itself was
simple and easily done by a human. But then the idea came to write a linter using AI, that could
ensure that this issue would not happen again.

Until there, everything seemed good. The problem started when I read the code of the linter itself.

In two words? **Really bad**. Not that it didn't do the job. It seemed to do it. But it wasn't a
code I could willingly accept into the codebase. It was really hard to understand, it didn't care
much about readability, it made stupidly long methods, it was _very_ inconsistent, using `continue`
at one point but `pass` ten lines later in the exact same kind of loop. It was calling methods in
methods, several times, making everything hard to understand about this code.

So, yeah, I blocked the PR, and asked for this linter to be rewritten intelligibly. The result? 80
lines shorter, far more straightforward, without needing to know how some very specific python
libraries work.

Clearly, in this case, the human written code is far better. Both as code that can work, but more
importantly, as code than can be maintained. And I believe, and will stand by this, that code,
especially in a professional context, must be as easy to maintain as possible, and if that means
making things a little less good but with a lower entry bar, it's a good thing. Yes, maybe there is
a very smart library, maybe even included in Python, that can do some things you want done. But if
it is unknown by the people who will need to maintain the code, then you shouldn't use it.

## A few other LLM-written PRs I refused

### Tests written for a beginner manual

This was the last, and really angered me, but there were other, previous ones. In one of those, a
very nice test class was going through all the different possibilities for a condition. What did it
look like?

The code the follows is only made to show what it looked like, the real code was obviously
different, but the spirit is the same. It's written with _Pathfinder 2e_ rules in mind, and it's not
good, but that's not the point.

```python
# The code
def can_attack(weapon: Weapon, enemy_range: int) -> tuple[bool, int]:
    """
    Tells if a weapon can touch an enemy within range.

    Returns a tuple (boolean, int)
        The boolean is True if the attack can be done, and the int is a malus.
        The malus can only be positive for ranged weapons
        If not possible, returns (False, 0)
    """
    if weapon.ranged:
        if enemy_range > 6 * weapon.range:
            return False, 0
        malus = 2 * (enemy_range // weapon.range)
        return True, malus
    return (range <= weapon.range), 0


# The test
FIVE_FEET = 5
TEN_FEET = 10
TWO_HUNDRED_FEET = 200

class TestCanAttack:
    def setUp(self):
        self.longsword = WeaponFactory(type="longsword")
        self.longsbow = WeaponFactory(type="longbow")

    def test_can_attack_melee(self):
        # Compute condition and malus
        condition, malus = can_attack(self.longsword, FIVE_FEET)

        # Verify
        assert condition is True
        assert malus == 0

    def test_cannot_attack_melee(self):
        # Compute condition and malus
        condition, malus = can_attack(self.longsword, TEN_FEET)

        # Verify
        assert condition is False
        assert malus == 0

    def test_can_attack_ranged(self):
        # Compute condition and malus
        condition = can_attack(self.longsword, TEN_FEET)

        # Verify
        assert condition is True
        assert malus == 0

    def test_compute_malus_ranged(self):
        # Compute condition and malus
        condition, malus = can_attack(self.longbow, TWO_HUNDRED_FEET)

        # Verify
        assert condition is True
        assert malus == 4

    def test_cannot_attack_ranged(self):
        # Compute condition and malus
        condition = can_attack(self.longsword, 1000)

        # Verify
        assert condition is False
        assert malus == 0
```

The issue I had with the code was the tests. Yes, they exist, and they test the different
computations this function does. However, my issue is with the comments. Here, they are only telling
what the code does, but they explain in no way why those are the results expected. However, this is
exactly what I would need to see here. Why is the result this one? If there is an issue with the
code later, I expect to be able to use the tests to find and fix it, but if the tests are useless,
then I will lose time searching for the bug.

The tests written in those tests are the kind of tests that I would like to see in a beginner
manual, potentially. In a place where I am learning how to write tests. But here, in a professional
context, I want them to be useful, and to help people who already know how to write code.

### Stupidity at its finest

This one is… hard to tell. I don't really know where to begin.

In a few words, the LLM fixed something that it considered a bug (it wasn't), and decided that it
needed a test to ensure its implementation of the fix was still there, so there was no regression.

The thing the LLM missed is that in the same fix, it rewrote 10 lines of code and stopped using a
specific method, and it was the removal of this method that fixed the imagined bug. Nothing else.
Basically, the implementation it tested was not the fix.

So when people tell me that LLM can reason, I just laugh. I've seen it write that was not good at
all, try to generate stupid code, imagine fix to imaginary bugs. And more importantly, having no
understanding at all of the code generated.

## Rant over – LLM can be useful

Okay, time to end this rant. LLM have been making me lose time recently, especially time I spend
reviewing PR. But it's not all bad.

I used them to test my ideas, to help me debug commands regex and `sed` commands that were supposed
to work but didn't because I missed a small thing at some point. They can do front-end development
far better than I can. They can replicate existing code really well, when pointed in the correct
direction.

But they are just equally bad. They make us lazier, and I fear a big diminishing of language
capacities in the future, if people stop writing or reading and instead use LLM for everything.

I hope I'm wrong. And I also hope that if the code breaks one day, I'll still be there to fix it.
