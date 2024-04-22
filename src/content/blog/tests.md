---
author: Baptiste Marlet
pubDatetime: 2024-04-19T07:00:00Z
title: A testing philosophy — on my use of unit tests
postSlug: a-testing-philosophy-on-my-use-of-unit-tests
featured: true
draft: true
tags:
  - tech
  - tests
ogImage: ""
description: This post doesn't try to be a manual, but a presentation of my testing philosophy.
---

## Table of contents

## Introduction

How many times did we, as software engineer, hear that code should be tested? I'd guess a lot. Code
should be clear, tested, should work… Well, I have _opinions_ about tests. If you care about them,
I'll try to share as much of my testing philosophy here. Mostly, this intend to present how I write
tests, what I want to test, and how I use my tests.

## Writing unit tests

So I wrote my app. It works, I know it, my code is mostly good, in a state where I feel confident in
delivering it. I have a database structure, API routes. Good. Now, does it actually work? And even
more important, how can I ensure that nothing will break when I add changes in the app? Well, **this
is why I write tests**.

### Writing API tests

In the fictional case I will use for this article, I have an app to manage Pathfinder characters,
which I can create directly in the app or import from another source on the web (more on that
later).

So let's assume the first part of the code was test creation. I could write tests like those:

```python
class TestCharacterCreation:
    def test_character_creation(self):
        payload = ...
        response = post("/character/new", payload)
        assert response.status_code == 201
        assert ...

    def test_character_update(self):
        character = CharacterFactory()
        payload = ...
        response = put(f"/character/{character.id}", payload)
        assert response.status_code == 200
        assert ...
```

With those tests, I can ensure that my payload does indeed create a character, and then that I can
modify said character. But mostly, those tests ensure that future changes will not break character
creation or update.

But here's the thing. I can write tests to detect future breaking changes. To detect if the code I
wrote executes as expected or not. Those tests are quite common, but they are not the only ones I
find useful.

### Writing tests to prove performance improvements

At some point, we find that some routes in our app are slow, and more than that, that it is becoming
critical. In a real situation, we would investigate on what happens here. Let's assume, for this
article, that we have found a performance issue.

I consider that performance issues are difficult to showcase in tests. This is mostly due to the
fact that most of them will only appear when using the app. Even so, there are some cases where
tests can be used to show those performance issues:

- External calls were done while they shouldn't have, and have been removed.
- Some N+1 queries were removed.

So that's great. The issue I found can be shown in tests. Now, how do I do that? How do I write my
test? How does it show, precisely, which issue is solved?

For external calls, the answer is probably patching. If you make external calls, patching them is
great practice. But when the call stops being made, I can use the test to show the call is not made
any more.

```python
from unittest.mock import patch

# With the call
def test_external_call():
    with patch("my_module.external_call") as external:
        code_calling_it()
    external.assert_called_with(...)


# Without the call
def test_external_call():
    with patch("my_module.external_call") as external:
        code_calling_it()
    external.assert_not_called(...)
```

With that, instead of just patching the external response, we can also prove that the call isn't
being made any more, thanks to the `assert_not_called`.

N+1 queries can be trickier: to show that they disappear, we need a way to print them somewhere in
our tests. Some tools exist, such as
[django-perf-rec](https://github.com/adamchainz/django-perf-rec) for django projects.

_Note: in both cases, to show the evolution in a git history, I would then make a commit to add the
test with the issue, whether an external call or the N+1. Then, in a second commit, I would remove
the issue and update the test to show that it is solved._

### Writing tests around asynchronous tasks

An additional topic I will cover is the case where an API call sends an asynchronous task. The
reasons for such a task to exist are numerous, either due to the performance of it, or because it
needs to call external API, or something else.

In this situation, my API route calls asynchronously a task, with `task.apply_async()` for instance,
in the case of a celery task. There are two types of tests we can do here:

- An end to end test, from the API call to the check of the task result, potentially when sent by
  the API.
- Several unit tests, with focus on: the first call and the task launch, the task itself, how we get
  the results.

Both have their pros and cons. However, when writing tests for tasks, I usually limit myself to unit
tests, considering that if all steps work on their own, there is no reason they wouldn't work
together.

Which brings me to writing the following tests:

```python
from unittest.mock import patch

def test_call_launches_task():
    with patch("path.to.tasks.my_task.apply_async") as task_call:
        response = post("/path/calling/task/", payload)
    assert response.status_code == 201  # Or 202 or else
    task_call.assert_called_with(...)  # My args



def test_task():
    # Create potential objects the task needs to run.
    # Then call the task itself.
    result = my_task(...)
    # Test that the results are what I expected.
    assert ...


def test_get_task_results():
    # Create the object that should be created by the task
    response = get("/path/calling/task/result/")
    assert response.status_code == 200
    assert ...  # Assert the results are correctly sent to the API
```

With this, I do have more tests. However, it allows for easier debugging. Indeed, if some step
fails, instead of having one big test in which several things happen, I can go directly to the test
that failed, and resolve that. Moreover, it ensures that if someone changes a part of this code in
the future, they will have dedicated tests directly, instead of having to search in a big test what
to change.

## Using unit tests

So I followed my guidelines, I have written unit tests for my whole app. Great. Now, how do I use
them? Why do I need those specific unit tests in my coding workflow?

Let's imagine several use cases, and go through each of them.

### The API answer is not coherent with what I should have

### Some specific operation is failing
