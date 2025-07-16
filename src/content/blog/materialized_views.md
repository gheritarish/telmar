---
author: Baptiste Marlet
pubDatetime: 2025-07-16T10:25:00Z
title: Improving performances with materialized views
postSlug: improving-performances-with-materialized-views
featured: true
draft: false
tags:
  - tech
  - performance
ogImage: ""
description: A recollection on using materialized views to improve performances.
---

## Table of contents

## Introduction

I've been working for a few years now, and I've had several times the question on what are
materialized views, and especially, how can they help us increasing our performances, either of our
API or asynchronous tasks.

As for my other posts, it's not supposed to be a manual, just a showcase of what type of problems
they solved for me in the past, and they could save in the future.

## SQL explain

I will make several references to SQL explain in this post.

If you've never used it, it's an incredible tool that SQL database have, that allow to get the plan
of a query. It will tell you which tables are called, in which order, which indexes are used for
joins, and much more.

The best command for Postgres is to use `EXPLAIN (ANALYZE, VERBOSE, COSTS, BUFFERS, FORMAT JSON)`.
This will actually run the query, but will have far more precise results, as the real number of rows
returned will be given, instead of an estimation. Similarly, it gives the real execution times of
the different parts of the query.

The result in itself is not always easy to read, and I use [Dalibo](https://explain.dalibo.com/) to
give me a graph and help me understand the plan.

## A short story

The ticket arrived as we expected it. We had noticed the issue in our monitoring, Grafana was
showing poor performances for this specific API route, our APM was confirming it. We knew we would
have to work on it at some point, the impact of the general performance of our API was quite
obvious, but now, there really was no avoiding it.

As for most performance issues, there were several possible culprits: a too big payload with useless
data, a slow object serialization, or SQL performance issues. Seeing the title of this post, the
issue we had was indeed the SQL.

The first step, as always, was to reproduce it. Locally, with an anonymized version of the database,
what was I able to do?

I plugged on the code a local APM, and launched the same API call. The problem came immediately, the
result took more than 2 seconds to compute, hurray! By making the same call a few dozen times, I got
quite reliable data, and the APM told me that the SQL query was the worst part of the call, taking
around 1.5 seconds.

Now that I had the query, I could run an explain on it, and give it to Dalibo, hoping for a clear
indication of what was the problem.

Since this happened in a previous job, I can't show you the result of the explanation, but what I
can say is this: the slowness came from on-the-fly computations. Those computations needed to call
big tables, and doing that on the fly was a good half of the query, slightly more.

With some investigations, mostly by talking to the other teams, we discovered that it was possible
to run those computations every day for every possible cases (in the thousands), and store the
results, so that we didn't have to compute on the fly again.

By adding a materialized view doing the computation and storing the results, the query could be
transformed with a single `JOIN`, and give us the same result far quicker. The p99 was divided by
more than two, and the ticket was solved.

## Using materialized views in production

Before answering this question, how actually does a materialized view work?

### Views and materialized views

What exactly is a view? A materialized view?

In SQL, a view is the result of a query that can be called when needed. For instance, if I write the
following:

```sql
CREATE VIEW character_count_by_user AS
SELECT users.id, users.email, COUNT(characters.id)
FROM users
JOIN characters ON characters.user_id=users.id
GROUP BY users.id, users.email
```

I am then able to get the number of each characters for the different users of the platform by
calling `SELECT * FROM character_count_by_user`.

However, those results will be computed each time I query this view, as it is not materialized.

A materialized view works nearly exactly the same, with two differences:

1. First, you create it with `CREATE MATERIALIZED VIEW`. Doing so will _store_ the results, exactly
   as if you had a table with that data.
2. To update the values in the view, you need to run the `REFRESH MATERIALIZED VIEW
character_count_by_user`, so that the data is updated.

As a note, the syntax used here is the one in Postgres, but the idea is the same everywhere.

Having a materialized view then means two things:

1. The data is stored, and can be accessed immediately, without a need for re-computation each time.
2. Until the view is refreshed, the data will not change, which means that having a materialized
   view on very frequently updated data will probably not work.

With this caveats in mind, we can go to production with our materialized view!

### Reaching production

As indicated, materialized views need to be updated to be relevant. However, it means they can be
used for different purposes that do not need to updated continuously:

- Daily statistics.
- Static data, or data that evolves rarely.

Since the data need to be updated, it's probably necessary to add a task to repeat every day (or any
other frequency that fits your use case) to refresh the materialized view. Daily statistics can be
updated during the night, rarely evolving data maybe every week…

However, it will not be possible to use them for every use case. If your data needs to be kept up to
date at every moment, or if the refresh time is far too long for your usage, you might want to stick
to on-the-fly calculations, despite the slowness those can bring to your application.

## Closing thoughts

Materialized views are a nice tool. While not suited to all the cases that might be encountered, it
can help some critical performance issues.

It's also important to notice that if a materialized view can help saving time by performing less
operations on-the-fly, if the concerned route is frequently called, it will also help other routes
by reducing the stress of the database.
