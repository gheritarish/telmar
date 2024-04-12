---
author: Baptiste Marlet
pubDatetime: 2024-04-12T14:00:00Z
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

For this presentation, I will use a dummy app, in which a user can use an API to create a Pathfinder
character. I would argue that how it works doesn't matter much as I have never coded such an app,
but I will give details about it if I need them.

## Writing unit tests

So I wrote my app. It works, I know it, my code is good and cannot be improved (that's obviously
wrong, but it would be false to say I never felt at least of little of that after developing hard
features). Actually, the truth is closer to "my code is decent and will not be improved _today_".
There are always ameliorations you can do, and some of them might not be useful today with 10 users
but will be in the future with 10,000.

Anyway, here I am, with my app written, the database structure as well as the API routes. Good. Now,
do they actually work? Can I ensure nothing will break when I add the next change in the app? **This
is why I write tests**.

In such a case, the tests could be something like that:

```python
class TestClass:
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

They ensure that my payload does indeed create a character (first test), I can run several asserts
on their features, and that I can update a character through the API, again with the possibility to
run asserts on their new features.

Basically, now I can ensure that my future changes will not break the character creation or update.
But this is like the level 0 of unit tests, the ones everyone write, and I do not want to focus on
that.
