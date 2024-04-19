---
author: Baptiste Marlet
pubDatetime: 2024-04-19T07:00:00Z
title: A testing philosophy
postSlug: a-testing-philosophy
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
