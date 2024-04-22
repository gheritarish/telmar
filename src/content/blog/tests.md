---
author: Baptiste Marlet
pubDatetime: 2024-06-18T08:40:00Z
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
delivering it. I have a database structure, API routes. Good. Now, does it _actually_ work? And even
more important, how can I ensure that nothing will break when I add changes in the app? Well, **this
is why I write tests**.

In the fields I am working in, web development, I find my tests to have two main objectives: either
to test some functionality, or to test some performance change.

I decided to divide this part in three however: a small part on API tests, one on unit testing
performance improvements, and a last one on tests around asynchronous tasks.

### Writing API tests

In the fictional case I will use for this article, I have written an app to manage Dungeons &
Dragons characters, which I can create directly in the app or import from another source on the web
(more on that later).

So let's assume the first part of the code was character creation. I could write tests like those:

```python
def test_character_creation():
    payload = ...
    response = post("/character/new", payload)
    assert response.status_code == 201
    assert ...


def test_character_update():
    character = CharacterFactory()
    payload = ...
    response = put(f"/character/{character.id}", payload)
    assert response.status_code == 200
    assert ...
```

With those tests, I can ensure that my payload does indeed create a character, and then that I can
modify a character. But mostly, those tests ensure that future changes will not break character
creation or update.

Honestly, this should be a given everywhere. The stage 0 of tests. Does the nominal use case work,
and does it still work if I change anything in the future?

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
great practice. But when the call is removed from the code, I can use the test to show the call is
not made any more.

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
the issue and update the test to show that it is solved. But I'll talk about commits in the future._

### Writing tests around asynchronous tasks

An additional topic I will cover is the case where an API call sends an asynchronous task. The
reasons for such a task to exist are numerous, either due to the performance of it, or because it
needs to call external API, or something else.

In this situation, my API route calls asynchronously a task that will import a character from an
external source, with `task.apply_async()`, since it is a celery task. There are two types of tests
we can do here:

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

This case has become a classic since I began working some years ago. You develop a new API, you
design a swagger for it, and then, either you missed something during your implementation, or
someone asks for new specifications with a new field that you hadn't taken into account.

With the tests I have around my API, this is easy for me to debug. I can simply make two commits,
one showing the missing field, updating a test, and a second, adding the new field to the payload,
and showing its presence in the test.

This leads to code such as:

```python
# after the first commit
def test_character_retrieval():
    character = CharacterFactory()
    response = get(f"/character/{character.id}")
    assert response.status_code == 200
    assert ...
    assert not "..." in response.json()


# after the second commit
def test_character_creation():
    character = CharacterFactory()
    response = get(f"/character/{character.id}")
    assert response.status_code == 200
    assert ...
    assert response.json()["..."] == ...
```

While I could technically write a new test, I don't need to do it: I already have a test to validate
my API, so I can simply use this one.

### Some specific operation is failing

A second common case is the one where a specific operation is failing, such as an asynchronous task
not being called, or being called with the wrong arguments.

In a perfect scenario, this kind of error is found during testing, through logs. But at some points,
you want to fix the bug. And to do so, you use your tests.

If your tests were fully written from the start, you should have a test where the task call is
patched, and testing if the call is made with the right arguments. If this is not the case, it's
time to write those tests.

To help you debug this kind of errors, you want to have the smallest scope possible. Make only one
API call, only call one task, only create the one object you need… potentially, other tasks are
called at the same moment, and they interfere. Or maybe you missed something in the different tests
of the task, and you find some kind of side effect. Many errors are possible. But with a small test
scope, you can find it more easily.

## Closing thoughts

Tests are a vast subject. I've presented here the philosophy I've used daily at work until now. It
might not work in other contexts, where tests have a different focus.

A lot has already been written on testing in the past. This should absolutely not be taken as a
source of truth, only at my thoughts on the subject. You can have excellent applications with very
few tests, and vice versa. In the end, it's up to you and your collaborators to decide what needs to
be tested, and how you wish to do so.
